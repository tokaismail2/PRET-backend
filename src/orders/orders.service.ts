import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../models/order.schema';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UserWallet, UserWalletDocument } from '../models/userWallet.schema';
import { WalletTransaction, WalletTransactionDocument } from '../models/walletTransactions.schema';
import { WarehouseReceipt, WarehouseReceiptDocument } from '../models/warehouseReceipt.schema';
import { Warehouse, WarehouseDocument } from '../models/warehouse.schema';
import { Generator, GeneratorDocument } from '../models/generator.schema';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Material, MaterialDocument } from '../models/material.schema';
import { Route, RouteDocument } from '../models/route.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
    @InjectModel(WalletTransaction.name) private walletTransactionModel: Model<WalletTransactionDocument>,
    @InjectModel(WarehouseReceipt.name) private warehouseReceiptModel: Model<WarehouseReceiptDocument>,
    @InjectModel(Warehouse.name) private warehouseModel: Model<WarehouseDocument>,
    @InjectModel(Generator.name) private generatorModel: Model<GeneratorDocument>,
    @InjectModel(Material.name) private materialModel: Model<MaterialDocument>,
    @InjectModel(Route.name) private routeModel: Model<RouteDocument>,
  ) { }


  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    // Find user by ID
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check if user is a generator
    if (user.role !== UserRole.GENERATOR) {
      throw new BadRequestException('Only generators can create orders');
    }

    // Resolve lat/lng: use body values or fallback to generator profile
    let lat = createOrderDto.lat;
    let lng = createOrderDto.lng;
    let address = createOrderDto.address;

    if (lat == null || lng == null) {
      const generatorProfile = await this.generatorModel.findOne({ user: new Types.ObjectId(userId) });

      if (!generatorProfile) {
        throw new NotFoundException('Generator profile not found');
      }

      const coords = generatorProfile.address?.coordinates;

      if (!coords?.latitude || !coords?.longitude) {
        throw new BadRequestException(
          'No location provided and generator profile has no coordinates',
        );
      }

      lat = coords.latitude;
      lng = coords.longitude;

      // Also fallback address if not provided
      if (!address) {
        const { street, city, country } = generatorProfile.address;
        address = [street, city, country].filter(Boolean).join(', ');
      }
    }

    // Calculate total price
    const totalPrice = createOrderDto.quantity * createOrderDto.price;

    // Create order
    const order = new this.orderModel({
      generatorId: userId,
      materialTypeId: new Types.ObjectId(createOrderDto.materialType),
      quantity: createOrderDto.quantity,
      unit: createOrderDto.unit,
      price: createOrderDto.price,
      totalPrice,
      status: OrderStatus.PENDING,
      photos: createOrderDto.photos || [],
      notes: createOrderDto.notes,
      lat,
      lng,
      address,
    });

    return order.save();
  }

  async getAllOrders(filters: {
    status?: string;
    generatorId?: string;
    driverId?: string;
    factoryId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    // Initialize an empty query object
    const query: any = {};

    // Filter by status
    if (filters.status) {
      query.status = filters.status;
    }

    // Filter by generator
    if (filters.generatorId) {
      query.generatorId = filters.generatorId;
    }

    // Filter by driver
    if (filters.driverId) {
      query.driverId = filters.driverId;
    }

    // Filter by factory
    if (filters.factoryId) {
      query.factoryId = filters.factoryId;
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};

      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const orders = await this.orderModel
      .find(query)
      .populate('generatorId', 'name email phone')
      .populate('materialTypeId', 'name price')
      .sort({ createdAt: -1 })
      .lean();

    // Get all user IDs in one shot
    const userIds = orders
      .map((order) => (order.generatorId as any)?._id)
      .filter(Boolean);

    // Single query instead of N queries
    const generators = await this.generatorModel
      .find({ user: { $in: userIds } })
      .select('user businessName generatorType address')
      .lean();

    // Fast map lookup
    const generatorMap = new Map(
      generators.map((g) => [g.user.toString(), g])
    );

    // Enrich orders with generator data
    return orders.map((order) => {
      const userId = (order.generatorId as any)?._id?.toString();
      return {
        ...order,
        generator: generatorMap.get(userId) || null,
      };
    });
  }

  async getMyOrdersHistory(userId: string, status?: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let filter: any = {};

    if (user.role === UserRole.GENERATOR) {
      filter.generatorId = userId;
    }
    else if (user.role === UserRole.DRIVER) {
      filter.driverId = userId;
    }
    else {
      throw new ForbiddenException('Invalid role');
    }

    // add status only if it exists
    if (status) {
      filter.status = status;
    }

    const orders = await this.orderModel
      .find(filter)
      .populate('materialTypeId')
      .sort({ createdAt: -1 })
      .exec();

    return orders;
  }

  async cancelOrder(orderId: string, userId: string, reason: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order cannot be cancelled');
    }

    order.status = OrderStatus.CANCELLED;
    order.reason = reason;
    await order.save();

    return order;
  }

  async getOrderById(orderId: string, userId: string) {
    userId = userId.toString(); // important

    const order = await this.orderModel
      .findById(orderId)
      .populate('generatorId', 'name email phone')
      .populate('materialTypeId', 'name price')
      .populate('driverId', 'name email phone')
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Get generator details including address
    let generator = null;
    if (order.generatorId && (order.generatorId as any)._id) {
      generator = await this.generatorModel
        .findOne({ user: (order.generatorId as any)._id })
        .select('businessName generatorType address')
        .lean();
    }

    const orderWithAddress = {
      ...order,
      generator: generator || null,
    };


    return orderWithAddress;
  }

  async updateOrderById(orderId: string, updateDto: UpdateOrderDto) {

    const order = await this.orderModel.findOne({
      _id: orderId,
      status: OrderStatus.PENDING,
    });

    if (!order) {
      throw new ConflictException(
        'Order not found or cannot be updated (status is not PENDING)',
      );
    }

    // Build update object safely
    const updateData: any = {};

    if (updateDto.quantity !== undefined) {
      updateData.quantity = updateDto.quantity;
      updateData.totalPrice = updateDto.quantity * order.price;
    }

    if (updateDto.notes !== undefined) {
      updateData.notes = updateDto.notes;
    }

    //can update on photo 
    if (updateDto.photos !== undefined) {
      updateData.photos = updateDto.photos;
    }

    if (updateDto.materialType !== undefined) {
      updateData.materialTypeId = updateDto.materialType;
      const materialType = await this.materialModel.findById(updateDto.materialType);
      if (!materialType) {
        throw new NotFoundException('Material type not found');
      }
      updateData.price = materialType.price;
      updateData.totalPrice = updateData.quantity * materialType.price;
    }

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true },
    );

    return updatedOrder;
  }

  async deleteOrder(orderId: string, userId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user is the generator who created the order
    if (order.generatorId.toString() !== userId.toString()) {
      throw new UnauthorizedException('You do not have permission to delete this order');
    }

    // Check if order is in a state that can be deleted
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException('Order cannot be deleted as it is not in PENDING status');
    }

    // Delete the order
    await this.orderModel.findByIdAndDelete(orderId);

    return { message: 'Order deleted successfully' };
  }

  async assignDriverToRoute(orderIds: string[], driverUserId: string) {
    if (orderIds.length === 0) {
      throw new ConflictException('No orders provided');
    }

    const foundOrders = await Promise.all(
      orderIds.map(async (orderId) => {
        const order = await this.orderModel.findById(orderId);

        if (!order) {
          throw new NotFoundException(`Order ${orderId} not found`);
        }
        if (order.status !== OrderStatus.PENDING) {
          throw new ConflictException(`Order ${orderId} status is ${order.status}`);
        }
        if (order.driverId) {
          throw new ConflictException(`Order ${orderId} already has a driver`);
        }

        return order;
      }),
    );

    const result = await Promise.all(
      foundOrders.map(async (order) => {
        order.driverId = new Types.ObjectId(driverUserId);
        order.status = OrderStatus.IN_TRANSIT;
        await order.save();

        const generator = await this.userModel.findById(order.generatorId);
        if (!generator) {
          throw new NotFoundException(`Generator not found for order ${order._id}`);
        }

        const wallet = await this.userWalletModel.findOne({ userId: generator._id });
        wallet.balance += order.totalPrice;
        await wallet.save();

        const walletTransaction = new this.walletTransactionModel({
          walletId: wallet._id,
          type: 'deposit',
          amount: order.totalPrice,
          description: `Deposit for order ${order.orderCode}`,
          orderId: order._id,
        });
        await walletTransaction.save();

        return order;
      }),
    );

    return { orders: result };
  }

  //recive order from generator or not 
  async receiveOrderFromGenerator(
    orderId: string,
    driverUserId: string,
    order_code: string,
    is_received_from_generator: boolean
  ) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== OrderStatus.IN_TRANSIT) {
      throw new ConflictException(`Order ${orderId} status is ${order.status}`);
    }

    if (order.driverId.toString() !== driverUserId.toString()) {
      throw new ConflictException(`Driver is not assigned to order ${orderId}`);
    }

    if (is_received_from_generator) {

      if (!order_code || order.orderCode.toString() !== order_code.toString()) {
        throw new ConflictException(`Order code is incorrect`);
      }

      order.is_received_from_generator = true;
      order.status = OrderStatus.RECEIVED;
    } else {

      if (order_code) {
        throw new ConflictException(`Order code should not be provided`);
      }

      order.is_received_from_generator = false;
      order.status = OrderStatus.CANCELLED;
    }

    await order.save();

    return { order };
  }


  async arriveToWarehouse(
    orderIds: string[],
    warehouseId: string,
    otp: string,
    driverUserId: string
  ) {

    const foundOrders = await Promise.all(
      orderIds.map(async (orderId) => {
        const order = await this.orderModel.findById(orderId);

        if (!order)
          throw new NotFoundException(`Order ${orderId} not found`);
        if (order.status !== OrderStatus.RECEIVED)
          throw new ConflictException(`Order ${orderId} status is ${order.status}`);
        if (!order.is_received_from_generator)
          throw new ConflictException(`Order ${orderId} is not received from generator`);
        if (order.driverId.toString() !== driverUserId.toString())
          throw new ConflictException(`Driver is not assigned to order ${orderId}`);

        const existingReceipt = await this.warehouseReceiptModel.findOne({ order_id: order._id });
        if (existingReceipt)
          throw new ConflictException(`Warehouse receipt already created for order ${orderId}`);

        const verificationCode = '123456';
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

        if (otp !== verificationCode || new Date() > expiresAt)
          throw new ConflictException(`Invalid or expired OTP for order ${orderId}`);

        return order;
      })
    );

    const warehouse = await this.warehouseModel.findById(warehouseId);
    if (!warehouse) throw new NotFoundException(`Warehouse ${warehouseId} not found`);

    const firstOrder = foundOrders[0];
    const generator = await this.generatorModel.findOne({
      user: firstOrder.generatorId
    } as any);
    if (!generator) throw new NotFoundException(`Generator not found`);


    const distance = this.haversineDistance(
      generator.address.coordinates.latitude,
      generator.address.coordinates.longitude,
      warehouse.location.coordinates.latitude,
      warehouse.location.coordinates.longitude,
    );

    // ✅ الروت مرة واحدة بره الـ map
    const route = await this.routeModel.create({
      driver: new Types.ObjectId(driverUserId),
      orderIds: orderIds.map(id => new Types.ObjectId(id)),
      destination: new Types.ObjectId(warehouseId),
      startPoint: {
        latitude: generator.address.coordinates.latitude,
        longitude: generator.address.coordinates.longitude,
      },
      distance,
    });

    const result = await Promise.all(
      foundOrders.map(async (order) => {
        const warehouseReceipt = await this.warehouseReceiptModel.create({
          warehouse_id: new Types.ObjectId(warehouseId),
          order_id: order._id,
          driver_id: new Types.ObjectId(driverUserId),
          received_weight: order.quantity,
          price_per_kg: order.price,
          total_amount: order.totalPrice,
        });

        order.status = OrderStatus.COMPLETED;
        order.warehouseId = new Types.ObjectId(warehouseId);
        await order.save();

        // Driver wallet logic
        const deliveryFee = order.totalPrice * 0.1;
        const driverWallet = await this.userWalletModel.findOne({ userId: driverUserId });
        driverWallet.balance += deliveryFee;
        await driverWallet.save();

        await this.walletTransactionModel.create({
          walletId: driverWallet._id,
          type: 'withdrawal',
          amount: deliveryFee,
          description: `trip_fee for order ${order._id}`,
        });

        return { order, warehouseReceipt };
      })
    );

    return { orders: result, route };
  }

  //return data of generator

  async getPendingRoutes() {
    const orders = await this.orderModel.aggregate([
      {
        $match: { status: 'pending' }
      },

      {
        $lookup: {
          from: 'users',
          localField: 'generatorId',
          foreignField: '_id',
          as: 'generatorUser'
        }
      },
      { $unwind: '$generatorUser' },

      {
        $lookup: {
          from: 'generators',
          let: { userId: '$generatorUser._id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$userId'] } } }
          ],
          as: 'generatorDetails'
        }
      },
      {
        $unwind: {
          path: '$generatorDetails',
          preserveNullAndEmptyArrays: true
        }
      },


      {
        $project: {
          _id: 1,
          quantity: 1,
          unit: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          orderCode: 1,
          price: 1,
          totalPrice: 1,
          photos: 1,
          lat: 1,
          lng: 1,
          address: 1,

          generator: {
            businessName: '$generatorDetails.businessName',
            generatorType: '$generatorDetails.generatorType',
          },

          materialTypeId: 1
        }
      },

      { $sort: { createdAt: -1 } }
    ]);



    const validOrders = orders.filter(
      (o) => o.lat != null && o.lng != null
    );

    const MAX_WEIGHT = 200;
    const MAX_DISTANCE = 30;

    const used = new Set<string>();
    const routes: Record<string, any[]> = {};
    let routeIndex = 1;

    for (let i = 0; i < validOrders.length; i++) {
      const current = validOrders[i];
      if (used.has(current._id.toString())) continue;

      const route: typeof validOrders = [current];
      used.add(current._id.toString());
      let totalWeight = current.quantity ?? 0;

      for (let j = 0; j < validOrders.length; j++) {
        if (i === j) continue;
        const candidate = validOrders[j];
        if (used.has(candidate._id.toString())) continue;

        const newWeight = totalWeight + (candidate.quantity ?? 0);
        if (newWeight > MAX_WEIGHT) continue;

        const withinDistance = route.every((routeOrder) => {
          const dist = this.haversineDistance(
            routeOrder.lat, routeOrder.lng,
            candidate.lat, candidate.lng,
          );
          return dist <= MAX_DISTANCE;
        });

        if (!withinDistance) continue;

        route.push(candidate);
        used.add(candidate._id.toString());
        totalWeight = newWeight;
      }

      routes[`route${routeIndex}`] = route;
      routeIndex++;
    }

    return routes;
  }
  async getMyHistoryRoutes(driverUserId: string) {
    const routes = await this.routeModel
      .find({ driver: new Types.ObjectId(driverUserId) })
      .populate('destination', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const totalRoutesCount = await this.routeModel.countDocuments({
      driver: new Types.ObjectId(driverUserId)
    });

    const walletBalance = await this.userWalletModel.findOne({ userId: driverUserId });
    const balance = walletBalance?.balance || 0;

    return { routes, totalRoutesCount, balance };
  }
  async getRouteById(routeId: string, driverUserId: string) {
    const route = await this.routeModel
      .findById(routeId)
      .populate('destination', 'name')
      .populate('orderIds')
      .lean();
    if (!route) throw new NotFoundException(`Route ${routeId} not found`);
    if (route.driver.toString() !== driverUserId.toString())
      throw new ConflictException(`Driver is not assigned to route ${routeId}`);
    return route;
  }
  // Helper
  private haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

