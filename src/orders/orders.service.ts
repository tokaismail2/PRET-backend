import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../models/order.schema';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

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
    return savedOrder;
  }

  async getOrdersByUser(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orders = await this.orderModel
      .find({ buyer: userId })
      .populate('seller', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();

    return orders;
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name email phone')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user has access to this order
    const user = await this.userModel.findById(userId);
    if (
      user.role !== UserRole.ADMIN &&
      order.buyer.toString() !== userId &&
      order.seller?.toString() !== userId
    ) {
      throw new UnauthorizedException('You do not have access to this order');
    }

    return order;
  }
}

