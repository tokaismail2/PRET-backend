import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auction, AuctionDocument } from '../models/auction.schema';
import { CreateAuctionDto } from './dto/create';
import { Waste, WasteDocument } from '../models/waste.schema';

@Injectable()
export class AuctionService {
  constructor(
    @InjectModel(Auction.name)
    private auctionModel: Model<AuctionDocument>,
    @InjectModel(Waste.name)
    private wasteModel: Model<WasteDocument>,
  ) { }

  async createAuction(dto: CreateAuctionDto) {
    const auction = new this.auctionModel(dto);
    const savedAuction = await auction.save();

    // Update waste status to 'in_auction'
    const waste = await this.wasteModel.findById(dto.waste_id);
    if (!waste) throw new BadRequestException('Waste not found');
    waste.status = 'in_auction';
    await waste.save();

    return savedAuction;
  }

  async closeAuction(auctionId: string) {
    const auction = await this.auctionModel.findById(auctionId);
    if (!auction) throw new BadRequestException('Auction not found');

    auction.status = 'closed';

    return auction.save();
  }

  async getAllAuctions() {
    return this.auctionModel.find().exec();
  }
}
