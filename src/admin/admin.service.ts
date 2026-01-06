
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../models/order.schema';
import { UpdateOrderDto } from '../orders/dto/update-order.dto';
import { User , UserDocument } from 'src/models';
import { Driver , DriverDocument} from 'src/models/driver.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
     @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
      @InjectModel(User.name) private userModel: Model<UserDocument>,
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

    return { success:true , message :"update order successfully" ,  data:order};
  }
  

    async getUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async getDrivers(): Promise<Driver[]> {
    return this.driverModel.find().exec();
  }
  


}
