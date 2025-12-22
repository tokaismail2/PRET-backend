import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus } from '../models/payment.schema';
import { Order, OrderDocument, OrderStatus } from '../models/order.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel('Payment')
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel('Order')
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  // 💳 Create payment
  async create(dto: CreatePaymentDto, userId: string) {
    const order = await this.orderModel.findById(dto.orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.buyer.toString() !== userId) {
      throw new UnauthorizedException('Not your order');
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Order already paid');
    }

    const payment = await this.paymentModel.create({
      user: userId,
      order: order._id,
      amount: dto.amount,
    });

    return payment;
  }

  // ✅ Confirm payment
  async confirm(paymentId: string, transactionId: string) {
    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = PaymentStatus.PAID;
    payment.transactionId = transactionId;
    await payment.save();

    await this.orderModel.findByIdAndUpdate(payment.order, {
      status: OrderStatus.COMPLETED,
    });

    return payment;
  }

  // 👀 Get all payments (admin)
  async findAll() {
    return this.paymentModel.find();
  }

  // 👤 Get my payments (user)
  async findMyPayments(userId: string) {
    return this.paymentModel.find({ user: userId });
  }

  // ❌ Fail payment
  async fail(paymentId: string) {
    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = PaymentStatus.FAILED;
    return payment.save();
  }

  // ❌ Remove payment (admin)
  async remove(paymentId: string) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return this.paymentModel.findByIdAndDelete(paymentId);
  }
}
