// waste.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/user.schema';
import { Payment, PaymentDocument } from '../models/payment.schema';


@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  // READ ALL
  async findAll(): Promise<Payment[]> {
    return this.paymentModel.find()
      .populate('user_id')
      .sort({ createdAt: -1 }).exec();
  }

}
