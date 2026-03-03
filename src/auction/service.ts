import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Auction, AuctionDocument } from '../models/auction.schema';
import { CreateAuctionDto } from './dto/create';
import { Waste, WasteDocument } from '../models/waste.schema';
import { AuctionBid, AuctionBidDocument } from '../models/auctionBids.schema';
import { User, UserDocument } from '../models/user.schema';
import { UserWallet, UserWalletDocument } from '../models/userWallet.schema';
import { WalletTransaction, WalletTransactionDocument } from '../models/walletTransactions.schema';

@Injectable()
export class AuctionService {
  constructor(
    @InjectModel(Auction.name)
    private auctionModel: Model<AuctionDocument>,
    @InjectModel(Waste.name)
    private wasteModel: Model<WasteDocument>,
    @InjectModel(AuctionBid.name)
    private auctionBidModel: Model<AuctionBidDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
    @InjectModel(WalletTransaction.name) private walletTransactionModel: Model<WalletTransactionDocument>,
  ) { }

  async createAuction(dto: CreateAuctionDto) {
    dto.waste_id = new Types.ObjectId(dto.waste_id);
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
      auction_id: auction._id,
      total_price: bidAmount,
      factory_id: factoryId,
    });
    await bid.save();

    auction.current_price = bidAmount;
    return auction.save();
  }


  async closeAuction(auctionId: string, adminId: string) {
    const auction = await this.auctionModel.findById(auctionId).lean();

    if (!auction) {
      throw new BadRequestException('Auction not found');
    }

    if (auction.status === 'closed') {
      throw new BadRequestException('Auction is already closed');
    }

    const highestBid = await this.auctionBidModel
      .findOne({ auction_id: new Types.ObjectId(auctionId) })
      .sort({ total_price: -1 })
      .lean();


    if (!highestBid) {
      await this.auctionModel.updateOne(
        { _id: auctionId },
        {
          status: 'closed',
          winnerFactory: null,
          final_price: null,
        }
      );

      return {
        status: 'closed',
        winnerFactory: null,
        final_price: null,
      };
    }

    await this.auctionModel.updateOne(
      { _id: auctionId },
      {
        status: 'closed',
        winnerFactory: highestBid.factory_id,
        final_price: highestBid.total_price,
      }
    );


    //update waste status to sold
    await this.wasteModel.updateOne(
      { _id: auctionId },
      { status: 'sold' }
    );

    // add price to admin wallet (driver take the action)
    const wallet = await this.userWalletModel.findOne({ userId: new Types.ObjectId(adminId) });
    if (!wallet) throw new NotFoundException('admin wallet not found');
    wallet.balance += highestBid.total_price;
    await wallet.save();

    //create wallet transaction 
    const walletTransaction = new this.walletTransactionModel({
      walletId: wallet._id,
      type: 'deposit',
      amount: highestBid.total_price,
      description: `Deposit for auction ${auction._id} for admin`,
    });
    await walletTransaction.save();

    //minus price from factory wallet
    const factory = await this.userModel.findById(highestBid.factory_id);
    if (!factory) throw new NotFoundException('Factory not found');

    const factoryWallet = await this.userWalletModel.findOne({ userId: factory._id });
    if (!factoryWallet) throw new NotFoundException('factory wallet not found');
    factoryWallet.balance -= highestBid.total_price;
    await factoryWallet.save();

    //create wallet transaction 
    const factoryWalletTransaction = new this.walletTransactionModel({
      walletId: factoryWallet._id,
      type: 'withdrawal',
      amount: highestBid.total_price,
      description: `Withdrawal for auction ${auction._id} from factory`,
    });
    await factoryWalletTransaction.save();



    return {
      status: 'closed',
      winnerFactory: highestBid.factory_id,
      final_price: highestBid.total_price,
    };


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

  //get active auctions for factory
  async getActiveAuctionsForFactory(factoryId: string) {
    return this.auctionModel.find({
      status: 'open'
    }).populate('waste_id');
  }

  async getWasteAuctions(status?: 'open' | 'closed') {
    const query: any = {};

    if (status) {
      query.status = status;
    }

    return this.auctionModel.find(query).populate('waste_id').sort({ createdAt: -1 }).lean();
  }





}
