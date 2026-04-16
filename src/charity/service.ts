import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CharityDocument, Charity } from '../models/charity.schema';
import { CreateCharityDto } from './dto/create';

@Injectable()
export class CharityService {
  constructor(
    @InjectModel(Charity.name)
    private charityModel: Model<CharityDocument>,

  ) { }

  async createCharity(dto: CreateCharityDto) {
    const charity = new this.charityModel(dto);
    const savedCharity = await charity.save();


    return savedCharity;
  }

  //get paginated charity for admin
  async getCharity(skip: number, limit: number) {
    const total = await this.charityModel.countDocuments().lean();
    const dataResult = await this.charityModel.find().skip(skip).limit(limit).lean();
    const totalPages = Math.ceil(total / limit);
    const page = skip / limit + 1;

    return {
      message: 'charity fetched successfully',
      data: {
        charities: dataResult,
        pagination: { total, page, limit, totalPages },
      },
    };
  }

  async getCharityCount() {
    return this.charityModel.countDocuments().lean();
  }



}
