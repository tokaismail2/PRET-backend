import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus, MaterialType } from '../models/order.schema';
import { Donation, DonationDocument, DonationStatus } from '../models/donation.schema';
import { User, UserDocument } from '../models/user.schema';
import {
  DashboardResponseDto,
  SummaryStatisticsDto,
  PendingPickupDto,
  TopRecycledMaterialsDto,
  MaterialBreakdownDto,
  MonthlyRecyclingDto,
  RecentActivityDto,
} from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Donation.name) private donationModel: Model<DonationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getDashboard(userId: string): Promise<DashboardResponseDto> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all orders and donations for the user
    const allOrders = await this.orderModel
      .find({ buyer: userId })
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .exec();

    const allDonations = await this.donationModel
      .find({ donor: userId })
      .populate('charity', 'name')
      .sort({ createdAt: -1 })
      .exec();

    // Calculate summary statistics
    const summary = await this.calculateSummary(
      userId,
      allOrders,
      allDonations,
      startOfMonth,
      startOfLastMonth,
      endOfLastMonth,
    );

    // Get pending pickups
    const pendingPickups = this.getPendingPickups(allOrders, allDonations);

    // Get top recycled materials
    const topRecycledMaterials = this.getTopRecycledMaterials(
      allOrders,
      startOfMonth,
    );

    // Get monthly recycling stats
    const monthlyRecycling = this.getMonthlyRecycling(
      allOrders,
      startOfMonth,
      startOfLastMonth,
      endOfLastMonth,
    );

    // Get recent activity
    const recentActivity = this.getRecentActivity(allOrders, allDonations);

    return {
      summary,
      pendingPickups,
      topRecycledMaterials,
      monthlyRecycling,
      recentActivity,
    };
  }

  private async calculateSummary(
    userId: string,
    allOrders: OrderDocument[],
    allDonations: DonationDocument[],
    startOfMonth: Date,
    startOfLastMonth: Date,
    endOfLastMonth: Date,
  ): Promise<SummaryStatisticsDto> {
    // Total pickups (all time)
    const totalPickups = allOrders.length + allDonations.length;

    // Total pickups last month
    const ordersLastMonth = await this.orderModel.countDocuments({
      buyer: userId,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const donationsLastMonth = await this.donationModel.countDocuments({
      donor: userId,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const totalPickupsLastMonth = ordersLastMonth + donationsLastMonth;

    // Calculate percentage change
    const totalPickupsChange =
      totalPickupsLastMonth > 0
        ? ((totalPickups - totalPickupsLastMonth) / totalPickupsLastMonth) * 100
        : 0;

    // Review status (in progress items)
    const inProgressOrders = allOrders.filter(
      (order) =>
        order.status === OrderStatus.ACTIVE 
    ).length;
    const inProgressDonations = allDonations.filter(
      (donation) =>
        donation.status === DonationStatus.COMPLETED
    ).length;
    const reviewStatus = inProgressOrders + inProgressDonations;

    // Revenue earned (from completed orders this month)
    const completedOrdersThisMonth = allOrders.filter(
      (order) =>
        order.status === OrderStatus.COMPLETED &&
        order.createdAt >= startOfMonth &&
        order.totalPrice,
    );
    const revenueEarned = completedOrdersThisMonth.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0,
    );

    // Revenue last month
    const completedOrdersLastMonth = await this.orderModel.find({
      buyer: userId,
      status: OrderStatus.COMPLETED,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const revenueLastMonth = completedOrdersLastMonth.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0,
    );
    const revenueChange =
      revenueLastMonth > 0
        ? ((revenueEarned - revenueLastMonth) / revenueLastMonth) * 100
        : 0;

    // Meals donated this month
    const donationsThisMonth = allDonations.filter(
      (donation) => donation.createdAt >= startOfMonth,
    );
    const mealsDonated = donationsThisMonth.reduce(
      (sum, donation) => sum + donation.mealsProvided,
      0,
    );

    return {
      totalPickups,
      totalPickupsChange: Math.round(totalPickupsChange * 100) / 100,
      reviewStatus,
      revenueEarned: Math.round(revenueEarned * 100) / 100,
      revenueChange: Math.round(revenueChange * 100) / 100,
      mealsDonated,
    };
  }

  private getPendingPickups(
    orders: OrderDocument[],
    donations: DonationDocument[],
  ): PendingPickupDto[] {
    const pending: PendingPickupDto[] = [];

    // Add pending orders
    orders
      .filter((order) => order.status === OrderStatus.PENDING)
      .forEach((order) => {
        const materialTypeName = this.getMaterialDisplayName(order.materialType);
        let description = '';
        
        if (order.materialType === MaterialType.ORGANIC) {
          description = 'Oil pickup from main branch';
        } else {
          description = `${materialTypeName} waste collection`;
        }
        
        pending.push({
          id: order._id.toString(),
          type: 'order',
          scheduledDate: order.scheduledPickupDate || order.createdAt || new Date(),
          description,
          status: order.status,
        });
      });

    // Add pending donations
    donations
      .filter((donation) => donation.status === DonationStatus.PENDING)
      .forEach((donation) => {
        pending.push({
          id: donation._id.toString(),
          type: 'donation',
          scheduledDate: donation.scheduledPickupDate || donation.createdAt || new Date(),
          description: 'Food Donations',
          status: donation.status,
        });
      });

    // Sort by scheduled date and return top 5
    return pending
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
      .slice(0, 5);
  }

  private getTopRecycledMaterials(
    orders: OrderDocument[],
    startOfMonth: Date,
  ): TopRecycledMaterialsDto {
    // Get orders from this month
    const ordersThisMonth = orders.filter(
      (order) => order.createdAt >= startOfMonth,
    );

    // Group by material type
    const materialMap = new Map<string, { quantity: number; unit: string }>();

    ordersThisMonth.forEach((order) => {
      const current = materialMap.get(order.materialType) || {
        quantity: 0,
        unit: order.unit,
      };
      current.quantity += order.quantity;
      materialMap.set(order.materialType, current);
    });

    // Convert to array and calculate percentages
    const breakdown: MaterialBreakdownDto[] = [];
    let total = 0;

    materialMap.forEach((value, materialType) => {
      total += value.quantity;
      breakdown.push({
        materialType,
        quantity: value.quantity,
        percentage: 0, // Will calculate after we have total
        unit: value.unit,
      });
    });

    // Calculate percentages
    breakdown.forEach((item) => {
      item.percentage = total > 0 ? (item.quantity / total) * 100 : 0;
    });

    // Sort by quantity descending
    breakdown.sort((a, b) => b.quantity - a.quantity);

    // Determine unit (use most common unit or default to kg)
    const unit = breakdown.length > 0 ? breakdown[0].unit : 'kg';

    return {
      total: Math.round(total * 100) / 100,
      unit,
      breakdown: breakdown.map((item) => ({
        ...item,
        percentage: Math.round(item.percentage * 100) / 100,
      })),
    };
  }

  private getMonthlyRecycling(
    orders: OrderDocument[],
    startOfMonth: Date,
    startOfLastMonth: Date,
    endOfLastMonth: Date,
  ): MonthlyRecyclingDto {
    // Calculate total for this month
    const ordersThisMonth = orders.filter(
      (order) => order.createdAt >= startOfMonth,
    );
    let totalThisMonth = 0;
    ordersThisMonth.forEach((order) => {
      // Convert to kg for consistency (assuming most units can be converted)
      let quantityInKg = order.quantity;
      if (order.unit.toLowerCase() === 'tons' || order.unit.toLowerCase() === 'ton') {
        quantityInKg = order.quantity * 1000;
      } else if (order.unit.toLowerCase() === 'l' || order.unit.toLowerCase() === 'liter') {
        // For liquids, approximate 1L = 1kg
        quantityInKg = order.quantity;
      }
      totalThisMonth += quantityInKg;
    });

    // Calculate total for last month
    const ordersLastMonth = orders.filter(
      (order) =>
        order.createdAt >= startOfLastMonth &&
        order.createdAt <= endOfLastMonth,
    );
    let totalLastMonth = 0;
    ordersLastMonth.forEach((order) => {
      let quantityInKg = order.quantity;
      if (order.unit.toLowerCase() === 'tons' || order.unit.toLowerCase() === 'ton') {
        quantityInKg = order.quantity * 1000;
      } else if (order.unit.toLowerCase() === 'l' || order.unit.toLowerCase() === 'liter') {
        quantityInKg = order.quantity;
      }
      totalLastMonth += quantityInKg;
    });

    // Convert to tons
    const totalThisMonthTons = totalThisMonth / 1000;
    const totalLastMonthTons = totalLastMonth / 1000;

    // Calculate percentage change
    const change =
      totalLastMonthTons > 0
        ? ((totalThisMonthTons - totalLastMonthTons) / totalLastMonthTons) * 100
        : 0;

    return {
      total: Math.round(totalThisMonthTons * 100) / 100,
      unit: 'tons',
      change: Math.round(change * 100) / 100,
    };
  }

  private getRecentActivity(
    orders: OrderDocument[],
    donations: DonationDocument[],
  ): RecentActivityDto[] {
    const activities: RecentActivityDto[] = [];

    // Add order activities
    orders.slice(0, 10).forEach((order) => {
      const materialTypeName =
        order.materialType.charAt(0).toUpperCase() +
        order.materialType.slice(1);
      let title = '';
      let description = '';

      if (order.status === OrderStatus.ACTIVE && order.seller) {
        const seller = order.seller as any;
        const orderId = order._id.toString().slice(-4);
        title = `Order #${orderId} accepted`;
        description = `by ${seller.name || 'Factory'}`;
      } else if (order.status === OrderStatus.ACTIVE) {
        title = 'Pickup dispatched';
        description = `for ${materialTypeName.toLowerCase()} containers`;
      } else if (order.status === OrderStatus.PENDING) {
        title = 'New order created';
        // Use more specific material names
        const materialDesc =
          order.materialType === MaterialType.ORGANIC
            ? 'cooking oil'
            : order.materialType === MaterialType.PLASTIC
              ? 'plastic containers'
              : `${materialTypeName.toLowerCase()} scraps`;
        description = `for ${materialDesc}`;
      } else if (order.status === OrderStatus.COMPLETED) {
        title = 'Order completed';
        description = `${materialTypeName} waste collection`;
      }

      if (title) {
        activities.push({
          id: order._id.toString(),
          type: 'order',
          title,
          description,
          timestamp: order.createdAt || new Date(),
          status: order.status,
        });
      }
    });

    // Add donation activities
    donations.slice(0, 10).forEach((donation) => {
      let title = '';
      let description = '';

      if (donation.status === DonationStatus.COMPLETED && donation.charity) {
        const charity = donation.charity as any;
        title = 'Meals donated';
        description = `to ${charity.name || 'City Food Bank'}`;
      } else if (donation.status === DonationStatus.PENDING) {
        title = 'New donation created';
        description = `${donation.mealsProvided} meals`;
      } else if (donation.status === DonationStatus.ACCEPTED) {
        title = 'Donation accepted';
        description = `${donation.mealsProvided} meals`;
      }

      if (title) {
        activities.push({
          id: donation._id.toString(),
          type: 'donation',
          title,
          description,
          timestamp: donation.createdAt || new Date(),
          status: donation.status,
        });
      }
    });

    // Sort by timestamp descending and return top 10
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }

  private getMaterialDisplayName(materialType: MaterialType): string {
    const displayNames: Record<MaterialType, string> = {
      [MaterialType.PLASTIC]: 'Plastic',
      [MaterialType.PAPER]: 'Cardboard',
      [MaterialType.METAL]: 'Metal',
      [MaterialType.GLASS]: 'Glass',
      [MaterialType.ELECTRONICS]: 'Electronics',
      [MaterialType.ORGANIC]: 'Cooking Oil',
      [MaterialType.TEXTILES]: 'Textiles',
      [MaterialType.OTHER]: 'Other',
    };
    return displayNames[materialType] || materialType;
  }
}

