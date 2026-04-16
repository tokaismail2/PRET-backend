import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material, MaterialDocument } from '../models/material.schema';
import { CreateMaterialDto } from './dto/add-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel(Material.name) private materialModel: Model<MaterialDocument>,
  ) { }

  async create(createMaterialDto: CreateMaterialDto): Promise<MaterialDocument> {
    const createdMaterial = new this.materialModel(createMaterialDto);
    return createdMaterial.save();
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.materialModel.find().skip(skip).limit(limit).exec(),
      this.materialModel.countDocuments(),
    ]);

    return {
      data,
      total,
    };
  }

  async findOne(id: string): Promise<MaterialDocument> {
    const material = await this.materialModel.findById(id).lean();
    if (!material) {
      throw new NotFoundException(`Material with ID "${id}" not found`);
    }
    return material;
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto): Promise<MaterialDocument> {
    const existingMaterial = await this.materialModel
      .findByIdAndUpdate(id, updateMaterialDto, { new: true })
      .exec();
    if (!existingMaterial) {
      throw new NotFoundException(`Material with ID "${id}" not found`);
    }
    return existingMaterial;
  }

  async remove(id: string): Promise<MaterialDocument> {
    const deletedMaterial = await this.materialModel.findByIdAndDelete(id).exec();
    if (!deletedMaterial) {
      throw new NotFoundException(`Material with ID "${id}" not found`);
    }
    return deletedMaterial;
  }
}
