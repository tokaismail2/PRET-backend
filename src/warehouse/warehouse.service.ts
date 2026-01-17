import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Warehouse, WarehouseDocument } from '../models/warehouse.schema';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectModel(Warehouse.name)
    private warehouseModel: Model<WarehouseDocument>,
  ) { }

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    const warehouse = new this.warehouseModel(dto);
    return warehouse.save();
  }

  async findAll(filters: { isActive?: boolean }): Promise<Warehouse[]> {
    const query: Record<string, any> = {};

    if (filters.isActive !== undefined) {
      query.is_active = filters.isActive;
    }

    return this.warehouseModel.find(query).lean().exec();
  }

  async findOne(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseModel.findById(id).exec();
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return warehouse;
  }

  async update(
    id: string,
    dto: UpdateWarehouseDto,
  ): Promise<Warehouse> {
    const warehouse = await this.warehouseModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return warehouse;
  }

  async remove(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseModel.findByIdAndDelete(id);
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return warehouse;
  }


}
