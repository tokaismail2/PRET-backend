import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Maintenance, MaintenanceDocument } from '../models/maintenance.schema';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectModel(Maintenance.name)
    private readonly maintenanceModel: Model<MaintenanceDocument>,
  ) {}

  // إنشاء طلب صيانة
  async create(dto: CreateMaintenanceDto, userId: string) {
    const maintenance = new this.maintenanceModel({
      ...dto,
      user: new Types.ObjectId(userId), // مهم جدًا: تحويل الـ userId لـ ObjectId
    });
    return maintenance.save();
  }

  // طلبات المستخدم
  findMyRequests(userId: string) {
    return this.maintenanceModel.find({ user: new Types.ObjectId(userId) });
  }

  // كل الطلبات (admin)
  findAll() {
    return this.maintenanceModel.find().populate('user', 'email');
  }

  // تحديث حالة الطلب (admin)
  async update(id: string, dto: UpdateMaintenanceDto) {
    const request = await this.maintenanceModel.findById(id);
    if (!request) throw new NotFoundException('Maintenance request not found');

    request.status = dto.status;
    return request.save();
  }
}
