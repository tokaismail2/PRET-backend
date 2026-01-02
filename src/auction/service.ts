import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auction, AuctionDocument } from '../models/auction.schema';
import { CreateAuctionDto } from './dto/create';
import { BidDto } from './dto/bid';

@Injectable()
export class AuctionService {
  constructor(
    @InjectModel(Auction.name)
    private auctionModel: Model<AuctionDocument>,
  ) {}

  async createAuction(dto: CreateAuctionDto) {
    const auction = new this.auctionModel(dto);
    return auction.save();
  }

  async placeBid(auctionId: string, bid: BidDto) {
    const auction = await this.auctionModel.findById(auctionId);

    if (!auction || auction.status === 'closed') {
      throw new BadRequestException('Auction closed or not found');
    }

    auction.bids.push(bid);
    return auction.save();
  }

  async closeAuction(auctionId: string) {
    const auction = await this.auctionModel.findById(auctionId);
    if (!auction) throw new BadRequestException('Auction not found');

    if (auction.bids.length === 0) {
      auction.status = 'closed';
      return auction.save();
    }

    const winner = auction.bids.reduce((max, b) =>
      b.price > max.price ? b : max,
    );

    auction.winnerFactory = winner.factory;
    auction.status = 'closed';

    return auction.save();
  }

  async getAllAuctions() {
    return this.auctionModel.find().exec();
  }
}
