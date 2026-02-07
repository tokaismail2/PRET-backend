// waste.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Waste, WasteDocument } from '../models/waste.schema';
import { CreateWasteDto } from './dto/create';
import { UpdateWasteDto } from './dto/update';

@Injectable()
export class WasteService {
  constructor(
    @InjectModel(Waste.name)
    private wasteModel: Model<WasteDocument>,
  ) { }

  // استلام الويست من الوير هاوس 
  async create(createWasteDto: CreateWasteDto): Promise<Waste> {
    const waste = new this.wasteModel(createWasteDto);
    return waste.save();
    
  }

  // READ ALL
  async findAll(): Promise<Waste[]> {
    return this.wasteModel.find()
    .populate('warehouse_id')
    .sort({ createdAt: -1 }).exec();
  }

  // READ ONE
  async findOne(id: string): Promise<Waste> {
    const waste = await this.wasteModel.findById(id)
    .populate('warehouse_id')
    .exec();
    if (!waste) throw new NotFoundException('Waste not found');
    return waste;
  }

  // UPDATE
  async update(
    id: string,
    updateWasteDto: UpdateWasteDto,
  ): Promise<Waste> {
    const updatedWaste = await this.wasteModel.findByIdAndUpdate(
      id,
      updateWasteDto,
      { new: true },
    );

    if (!updatedWaste) throw new NotFoundException('Waste not found');
    return updatedWaste;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    const deletedWaste = await this.wasteModel.findByIdAndDelete(id);
    if (!deletedWaste) throw new NotFoundException('Waste not found');
    return { message: 'Waste deleted successfully' };
  }

}
