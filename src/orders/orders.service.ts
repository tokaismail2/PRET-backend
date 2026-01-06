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
import { Driver, DriverDocument } from '../models/driver.schema';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
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

    // Calculate total price
    const totalPrice = createOrderDto.quantity * createOrderDto.price;

    // Create order
    const order = new this.orderModel({
      buyer: userId,
      materialType: createOrderDto.materialType,
      quantity: createOrderDto.quantity,
      unit: createOrderDto.unit,
      price: createOrderDto.price,
      totalPrice: totalPrice,
      status: OrderStatus.PENDING,
      pickupLocation: createOrderDto.pickupLocation,
      notes: createOrderDto.notes,
      photos: createOrderDto.photos || [],
    });

    const savedOrder = await order.save();
    return {
      success: true,
      message: 'order created successfully',
      data: savedOrder,
    };
  }
  async getOrdersByUser(userId: string, status?: OrderStatus) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const query: any = { buyer: userId };
    if (status) {
      query.status = status;
    }

    const orders = await this.orderModel
      .find(query)
      .populate('seller', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();

    return {
      success: true,
      message: 'orders fetched successfully',
      data: orders,
    };

  }

  async getOrderById(orderId: string, userId: string) {
    userId = userId.toString(); // important

    const order = await this.orderModel
      .findById(orderId)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name email phone')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.userModel.findById(userId);

    const buyerId = (order.buyer as any)?._id?.toString();
    const sellerId = (order.seller as any)?._id?.toString();

    if (
      user.role !== UserRole.ADMIN &&
      buyerId !== userId &&
      sellerId !== userId
    ) {
      throw new UnauthorizedException('You do not have access to this order');
    }

    return {
      success: true,
      message: 'order fetched successfully',
      data: order,
    };
  }



  async assignDriver(orderId: string, driverId: string) {
    if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(driverId)) {
      throw new BadRequestException('Invalid ID');
    }

    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Waste order not found');
    }

    if (order.status !== 'accepted') {
      throw new ConflictException(`Order cannot be assigned status is ${order.status}`);
    }

    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new BadRequestException('Invalid driver');
    }

    if (order.driverId) {
      throw new ConflictException('Driver already assigned');
    }

    order.driverId = new Types.ObjectId(driverId);
    order.status = OrderStatus.ASSIGNED;

    await order.save();

    return {
      success: true,
      message: 'Driver assigned successfully',
      data: {
        order: order,
        driver: driver,
      }
    };
  }


  async markInTransit(orderId: string, currentDriverId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Waste order not found');
    }

    if (order.status !== 'assigned') {
      throw new ConflictException('Order is not ready for transit');
    }

    if (!order.driverId) {
      throw new BadRequestException('Order has no assigned driver');
    }

    if (order.driverId.toString() !== currentDriverId.toString()) {
      throw new ForbiddenException('You are not assigned to this order');
    }

    order.status = OrderStatus.IN_TRANSIT;

    await order.save();

    return {
      success: true,
      message: 'Order marked as in transit',
      data: {
        order: order,
      }
    };
  }


}

