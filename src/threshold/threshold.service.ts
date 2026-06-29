import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateThresholdDto } from './dto/add-theshold.dto';
import { UpdateThresholdDto } from './dto/update-threshold.dto';
import { Threshold, ThresholdDocument } from '../models/threshold.schema';

@Injectable()
export class ThresholdService {
  constructor(
    @InjectModel(Threshold.name) private thresholdModel: Model<ThresholdDocument>,
  ) { }

  async create(createThresholdDto: CreateThresholdDto): Promise<ThresholdDocument> {
    const createdThreshold = new this.thresholdModel(createThresholdDto);
    return createdThreshold.save();
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.thresholdModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      this.thresholdModel.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      message: 'thresholds fetched successfully',
      data: {
        thresholds: data,
        pagination: { total, page, limit, totalPages },
      },
    };
  }

  async findOne(id: string): Promise<ThresholdDocument> {
    const material = await this.thresholdModel.findById(id).lean();
    if (!material) {
      throw new NotFoundException(`threshold with ID "${id}" not found`);
    }
    return material;
  }

  async update(id: string, updateThresholdDto: UpdateThresholdDto): Promise<ThresholdDocument> {
    const existingMaterial = await this.thresholdModel
      .findByIdAndUpdate(id, updateThresholdDto, { new: true })
      .exec();
    if (!existingMaterial) {
      throw new NotFoundException(`threshold with ID "${id}" not found`);
    }
    return existingMaterial;
  }

  async remove(id: string): Promise<ThresholdDocument> {
    const deletedMaterial = await this.thresholdModel.findByIdAndDelete(id).exec();
    if (!deletedMaterial) {
      throw new NotFoundException(`threshold with ID "${id}" not found`);
    }
    return deletedMaterial;
  }
}
