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
  async findAll(req: any, page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;

    let filter: any = {};

    if (req.user.role !== 'admin') {
      filter.user_id = req.user.userId;
    }

    const [data, total] = await Promise.all([
      this.paymentModel.find(filter)
        .populate('user_id', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.paymentModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Payments fetched successfully',
      data: {
        payments: data,
        pagination: { total, page, limit, totalPages },
      },
    };
  }


  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(id)
      .populate('user_id', 'name role')
      .lean();
    if (!payment) throw new NotFoundException('Payment not found');

    const user = await this.userModel.findById(payment.user_id._id).lean();
    if (!user) throw new NotFoundException('User not found');

    let factory = null;
    if (user.role === 'factory') {
      factory = await this.userModel.findById(user._id).lean();
      if (!factory) throw new NotFoundException('Factory not found');
    }

    let driver = null;
    if (user.role === 'driver') {
      driver = await this.userModel.findById(user._id).lean();
      if (!driver) throw new NotFoundException('Driver not found');
    }

    let generator = null;
    if (user.role === 'generator') {
      generator = await this.userModel.findById(user._id).lean();
      if (!generator) throw new NotFoundException('Generator not found');
    }

    let admin = null;
    if (user.role === 'admin') {
      admin = await this.userModel.findById(user._id).lean();
      if (!admin) throw new NotFoundException('Admin not found');
    }

    const mergedData = {
      ...payment,
      user,
      factory,
      driver,
      generator,
      admin,
    };
    return mergedData;
  }
}
