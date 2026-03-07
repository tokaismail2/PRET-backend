import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
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
    dto.warehouse_id = new Types.ObjectId(dto.warehouse_id);

    const waste = await this.wasteModel.findById(dto.waste_id);
    if (!waste) throw new BadRequestException('Waste not found');

    const auction = new this.auctionModel(dto);
    const savedAuction = await auction.save();

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
      { _id: auction.waste_id },
      { status: 'sold' }
    );

    // add price to admin wallet (driver take the action)
    const wallet = await this.userWalletModel.findOne({ userId: new Types.ObjectId(adminId) })
    if (!wallet) throw new NotFoundException(`admin wallet not found ${adminId}`);
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

  async getActiveAuctions(materialName?: string) {
    const pipeline: any[] = [
      { $match: { status: 'open' } },

      // Auction → Waste
      {
        $lookup: {
          from: 'wastes',
          localField: 'waste_id',
          foreignField: '_id',
          as: 'waste'
        }
      },
      { $unwind: '$waste' },

      // Waste → Material
      {
        $lookup: {
          from: 'materials',
          localField: 'waste.material_id',
          foreignField: '_id',
          as: 'waste.material'
        }
      },
      { $unwind: '$waste.material' },

      ...(materialName ? [{
        $match: { 'waste.material.name': materialName }
      }] : []),
    ];

    return this.auctionModel.aggregate(pipeline);
  }

  async getWasteAuctions(status?: 'open' | 'closed') {
    const query: any = {};

    if (status) {
      query.status = status;
    }
    return this.auctionModel.find(query)
      .populate({
        path: 'waste_id',
        populate: {
          path: 'material_id'
        }
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  // Get auction by ID with populated fields
  async getAuctionById(auctionId: string) {
    const auction = await this.auctionModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(auctionId),
        },
      },
      // Populate waste_id
      {
        $lookup: {
          from: "wastes",
          localField: "waste_id",
          foreignField: "_id",
          as: "waste",
        },
      },
      {
        $unwind: {
          path: "$waste",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Populate warehouse_id
      {
        $lookup: {
          from: "warehouses",
          localField: "warehouse_id",
          foreignField: "_id",
          as: "warehouse",
        },
      },
      {
        $unwind: {
          path: "$warehouse",
          preserveNullAndEmptyArrays: true,
        },
      },
      //populate winnerFactory ref User
      {
        $lookup: {
          from: "users",
          localField: "winnerFactory",
          foreignField: "_id",
          as: "winnerFactory",
        },
      },
      {
        $unwind: {
          path: "$winnerFactory",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Remove raw IDs, keep populated objects
      {
        $project: {
          waste_id: 0,
          warehouse_id: 0,
          winnerFactory: 0,
        },
      },
    ]);

    return auction[0] ?? null;
  }

  // Get recent 5 bids for an auction with highest bid
  async getRecentBids(auctionId: string) {
    const result = await this.auctionBidModel.aggregate([
      {
        $match: {
          auction_id: new mongoose.Types.ObjectId(auctionId),
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },

      // Step 1: Lookup the Factory document (has address, etc.)
      {
        $lookup: {
          from: 'factories',
          localField: 'factory_id',
          foreignField: 'user',   // ← Factory doc links to User via 'user' field
          as: 'factory',
        },
      },
      {
        $unwind: {
          path: '$factory',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Step 2: Lookup the User document for name, email, phone, etc.
      {
        $lookup: {
          from: 'users',
          localField: 'factory.user',
          foreignField: '_id',
          as: 'factory.user',
        },
      },
      {
        $unwind: {
          path: '$factory.user',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Step 3: Strip sensitive fields
      {
        $project: {
          factory_id: 0,
          'factory.__v': 0,
          'factory.user.password': 0,
          'factory.user.authProvider': 0,
          'factory.user.__v': 0,
        },
      },
    ]);

    return {
      recent_bids: result,
      highest_bid: result.length
        ? Math.max(...result.map((b) => b.total_price))
        : null,
    };
  }

  async getWasteAuction(
    factoryId: Types.ObjectId,
    active?: boolean,
    completed?: boolean,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    // Step 1: Get all auction IDs this factory has bid on
    const factoryBids = await this.auctionBidModel
      .find({ factory_id: factoryId })
      .distinct('auction_id');

    if (!factoryBids.length) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    // Step 2: Build auction query based on filter
    const auctionQuery: Record<string, any> = {
      _id: { $in: factoryBids },
    };

    if (active === true) {
      auctionQuery.winnerFactory = factoryId;
      auctionQuery.status = 'closed';
    } else if (completed === true) {
      auctionQuery.winnerFactory = factoryId;
      auctionQuery.status = 'closed';
      auctionQuery.is_finished = true;
    } else {
      auctionQuery.$or = [
        { winnerFactory: { $ne: factoryId } },
        { winnerFactory: null },
      ];
    }

    // Step 3: Run count + paginated fetch in parallel
    const [total, auctions] = await Promise.all([
      this.auctionModel.countDocuments(auctionQuery),
      this.auctionModel
        .find(auctionQuery)
        .populate({
          path: 'waste_id',
          model: 'Waste',
          populate: [
            { path: 'material_id', model: 'Material' },
            { path: 'warehouse_id', model: 'Warehouse' },
          ],
        })
        .populate('warehouse_id')
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Step 4: Attach bid price only for auctions in current page
    const pageAuctionIds = auctions.map((a) => a._id);

    const bidMap = await this.auctionBidModel
      .find({ factory_id: factoryId, auction_id: { $in: pageAuctionIds } })
      .lean();

    const bidByAuction = bidMap.reduce((acc, bid) => {
      acc[bid.auction_id.toString()] = bid.total_price;
      return acc;
    }, {} as Record<string, number>);

    const wastes = auctions.map((auction) => ({
      ...auction,
      my_bid_price: bidByAuction[auction._id.toString()] ?? null,
      // is_winner: auction.winnerFactory?.toString() === factoryId.toString(),
    }));

    return {
      wastes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async signIsFinished(auctionId: string, factoryId: Types.ObjectId) {
    const auction = await this.auctionModel.findById(auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }
    if (auction.winnerFactory?.toString() !== factoryId.toString()) {
      throw new Error('You are not the winner');
    }
    if (auction.is_finished) {
      throw new Error('Auction is already finished');
    }
    auction.is_finished = true;
    await auction.save();
    return auction;
  }



}
