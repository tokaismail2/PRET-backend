import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auction, AuctionDocument } from '../models/auction.schema';
import { CreateAuctionDto } from './dto/create';
import { Waste, WasteDocument } from '../models/waste.schema';
import { AuctionBid, AuctionBidDocument } from '../models/auctionBids.schema';

@Injectable()
export class AuctionService {
  constructor(
    @InjectModel(Auction.name)
    private auctionModel: Model<AuctionDocument>,
    @InjectModel(Waste.name)
    private wasteModel: Model<WasteDocument>,
    @InjectModel(AuctionBid.name)
    private auctionBidModel: Model<AuctionBidDocument>,
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

  async placeBid(auctionId: string, bidAmount: number, factoryId: string) {
    const auction = await this.auctionModel.findById(auctionId);
    if (!auction) throw new BadRequestException('Auction not found');

    if (auction.status !== 'open') throw new BadRequestException('Auction is not open');

    if (bidAmount <= auction.current_price) throw new BadRequestException('Bid amount must be greater than current price');

    //create bid
    const bid = new this.auctionBidModel({
      auction_id: auctionId,
      total_price: bidAmount,
      factory_id: factoryId,
    });
    await bid.save();

    auction.current_price = bidAmount;
    return auction.save();
  }

  async closeAuction(auctionId: string) {
    const auction = await this.auctionModel.findById(auctionId);
    if (!auction) throw new BadRequestException('Auction not found');

    auction.status = 'closed';
    //calculate winner factory
    const winnerFactory = await this.auctionBidModel.findOne({ auction_id: auctionId }).sort({ total_price: -1 });
    auction.winnerFactory = winnerFactory.factory_id;
    auction.final_price = winnerFactory.total_price;
    return auction.save();
  }

  //get all auctions with bids 
  async getAllAuctionsWithBids() {
    return this.auctionModel.aggregate([
      {
        $lookup: {
          from: 'auctionbids', // اسم collection في MongoDB
          localField: '_id',
          foreignField: 'auction_id',
          as: 'bids',
        },
      },
      {
        $lookup: {
          from: 'wastes',
          localField: 'waste_id',
          foreignField: '_id',
          as: 'waste',
        },
      },
      { $unwind: { path: '$waste', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'factories',
          localField: 'winnerFactory',
          foreignField: '_id',
          as: 'winnerFactory',
        },
      },
      { $unwind: { path: '$winnerFactory', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          highestBid: { $max: '$bids.total_price' },
        },
      },
    ]);
  }


}
