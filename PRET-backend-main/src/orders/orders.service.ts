import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../models/order.schema';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<OrderDocument>,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
  ) {}


  // CREATE
  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.isActive) throw new UnauthorizedException('Account is inactive');
    if (user.role !== UserRole.GENERATOR)
      throw new BadRequestException('Only generators can create orders');

    const totalPrice = createOrderDto.quantity * createOrderDto.price;

    const order = new this.orderModel({
      buyer: userId,
      ...createOrderDto,
      totalPrice,
      status: OrderStatus.PENDING,
      photos: createOrderDto.photos || [],
    });

    return order.save();
  }

  // READ ALL / FILTERED
  async getOrdersByUser(userId: string, status?: OrderStatus) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const query: any = { buyer: userId };
    if (status) query.status = status;

    return this.orderModel
      .find(query)
      .populate('seller', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  // READ BY ID
  async getOrderById(orderId: string, userId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name email phone');
    if (!order) throw new NotFoundException('Order not found');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const buyerId = (order.buyer as any)?._id.toString();
    const sellerId = (order.seller as any)?._id.toString();

    if (
      user.role !== UserRole.ADMIN &&
      buyerId !== userId &&
      sellerId !== userId
    ) {
      throw new UnauthorizedException('You do not have access to this order');
    }

    return order;
  }

  // UPDATE
  async updateOrder(
    orderId: string,
    updateOrderDto: UpdateOrderDto,
    userId: string,
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const buyerId = (order.buyer as any)?._id.toString();
    const sellerId = (order.seller as any)?._id.toString();

    if (
      user.role !== UserRole.ADMIN &&
      buyerId !== userId &&
      sellerId !== userId
    ) {
      throw new UnauthorizedException(
        'You do not have permission to update this order',
      );
    }

    Object.entries(updateOrderDto).forEach(([key, value]) => {
      if (value !== undefined) {
        (order as any)[key] = value;
      }
    });

    return order.save();
  }

  // DELETE
  async deleteOrder(orderId: string, userId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const buyerId = (order.buyer as any)?._id.toString();
    const sellerId = (order.seller as any)?._id.toString();

    if (
      user.role !== UserRole.ADMIN &&
      buyerId !== userId &&
      sellerId !== userId
    ) {
      throw new UnauthorizedException(
        'You do not have permission to delete this order',
      );
    }

    await order.deleteOne();
    return { success: true };
  }
}
