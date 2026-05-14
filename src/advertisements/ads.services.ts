
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Advertisement, AdvertisementDocument } from '../models/advertisement.schema';
import { emitNotification } from 'src/common/utils/notifications.system';
import { AddAdsDto } from './dto/addAds';


@Injectable()
export class AdsService {
  constructor(
    @InjectModel(Advertisement.name) private adsModel: Model<AdvertisementDocument>,

  ) { }

  async addAds(

    addAdsDto: AddAdsDto,
  ) {
    const ads = await this.adsModel.create(addAdsDto);

    emitNotification(`addAds`, {
      image: ads.image,
      title: ads.title,
      description: ads.description,
    })
    return { success: true, message: "ads created successfully", data: ads };
  }

  async getAllAds(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const ads = await this.adsModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.adsModel.countDocuments();
    const totalPages = Math.ceil(total / limit);

    return {
      success: true, data: {
        ads: ads,
        pagination: { total, page, limit, totalPages },
      },
    }
  }


  async deleteAds(id: string) {
    const ads = await this.adsModel.findByIdAndDelete(id);
    if (!ads) {
      throw new NotFoundException(`Ads with ID "${id}" not found`);
    }
    return { success: true, message: "ads deleted successfully", data: ads };
  }


  async getSingleAds(id: string) {
    const ads = await this.adsModel.findById(id);
    if (!ads) {
      throw new NotFoundException(`Ads with ID "${id}" not found`);
    }
    return { success: true, message: "ads fetched successfully", data: ads };
  }
}