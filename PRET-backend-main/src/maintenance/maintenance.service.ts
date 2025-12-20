import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Maintenance,
  MaintenanceDocument,
} from '../models/maintenance.schema';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectModel(Maintenance.name)
    private readonly maintenanceModel: Model<MaintenanceDocument>,
  ) {}

  // 🛠 create request
  create(dto: CreateMaintenanceDto, userId: string) {
    return this.maintenanceModel.create({
      ...dto,
      user: userId,
    });
  }

  // 👤 user requests
  findMyRequests(userId: string) {
    return this.maintenanceModel.find({ user: userId });
  }

  // 🛠 admin - all requests
  findAll() {
    return this.maintenanceModel.find().populate('user', 'name email');
  }

  // 🔄 update status (admin)
  async update(id: string, dto: UpdateMaintenanceDto) {
    const request = await this.maintenanceModel.findById(id);

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    request.status = dto.status;
    return request.save();
  }
}
