import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../models/order.schema';
import { UpdateOrderDto } from '../orders/dto/update-order.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async updateOrderById(
    orderId: string,
    updateData: UpdateOrderDto,
  ) {
    const order = await this.orderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true },
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
