import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Auction, AuctionDocument } from '../models/auction.schema';
import { CreateAuctionDto } from './dto/create';
import { Waste, WasteDocument } from '../models/waste.schema';
import { AuctionBid, AuctionBidDocument } from '../models/auctionBids.schema';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { UserWallet, UserWalletDocument } from '../models/userWallet.schema';
import { WalletTransaction, WalletTransactionDocument } from '../models/walletTransactions.schema';
import { Payment, PaymentDocument } from '../models/payment.schema';
import { PaymobService } from '../paymob/paymob.service';

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
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly paymobService: PaymobService,
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

    if (bidAmount < auction.current_price) throw new BadRequestException('Bid amount must be greater than or equal to current price');

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

  async getAllAuctionsWithBids(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const basePipeline = [
      {
        $lookup: {
          from: 'auctionbids',
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
    ];

    const [dataResult, countResult] = await Promise.all([
      this.auctionModel.aggregate([
        ...basePipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      this.auctionModel.aggregate([
        ...basePipeline,
        { $count: 'total' },
      ]),
    ]);
    const total = countResult.length;
    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Auctions fetched successfully',
      data: {
        auctions: dataResult,
        pagination: { total, page, limit, totalPages },
      },
    };

  }

  async getActiveAuctions(
    materialName?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

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

      ...(materialName
        ? [{ $match: { 'waste.material.name': materialName } }]
        : []),

      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];


    const result = await this.auctionModel.aggregate(pipeline);

    const total = result[0].totalCount[0]?.count || 0;

    return {
      message: 'auctions retrieved successfully',
      data: {
        auctions: result[0].data,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    };
  }

  async getWasteAuctions(
    status?: 'open' | 'closed',
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const data = await this.auctionModel.find(query)
      .populate({
        path: 'waste_id',
        populate: {
          path: 'material_id',
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await this.auctionModel.countDocuments(query);

    return {
      message: 'auctions retrieved successfully',
      data: {
        auctions: data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
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
          warehouse_id: 0
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
      .find({ factory_id: factoryId }) // ✅ removed status filter
      .distinct('auction_id');

    if (!factoryBids.length) {
      return { wastes: [], total: 0, page, limit, totalPages: 0 };
    }

    // Step 2: Build auction query
    const auctionQuery: Record<string, any> = {
      _id: { $in: factoryBids },
    };

    if (completed === true) {
      // استلم فعلاً
      auctionQuery.winnerFactory = factoryId;
      auctionQuery.status = 'closed';
      auctionQuery.is_finished = true;
      //payment done and status is completed
      const payments = await this.paymentModel.find({ auction_id: { $in: factoryBids }, status: 'completed' });
      const paidAuctionIds = payments.map((p) => p.auction_id);
      auctionQuery._id = { $in: paidAuctionIds };

    } else if (active === true) {
      // كسب لسه مستلمش
      auctionQuery.winnerFactory = factoryId;
      auctionQuery.status = 'closed';

    } else {
      //  my bids: مزادات  شارك فيها
    }

    // Step 3: Count + fetch
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

    // Step 4: Attach bid price + check payments in parallel
    const pageAuctionIds = auctions.map((a) => a._id);

    const [bidMap, paymentDocs] = await Promise.all([
      this.auctionBidModel
        .find({ factory_id: factoryId, auction_id: { $in: pageAuctionIds } })
        .lean(),
      this.paymentModel
        .find({ auction_id: { $in: pageAuctionIds } })
        .distinct('auction_id'),
    ]);

    const bidByAuction = bidMap.reduce(
      (acc, bid) => {
        acc[bid.auction_id.toString()] = bid.total_price;
        return acc;
      },
      {} as Record<string, number>,
    );

    const paidAuctionIds = new Set(
      paymentDocs.map((id) => id.toString()),
    );

    const wastes = auctions.map((auction) => ({
      ...auction,
      my_bid_price: bidByAuction[auction._id.toString()] ?? null,
      is_winner: auction.winnerFactory?.toString() === factoryId.toString(),
      hasPayment: paidAuctionIds.has(auction._id.toString()),
    }));

    return { wastes, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async signIsFinished(
    auctionId: string,
    factoryId: Types.ObjectId,
    paymentMethod: 'cash' | 'online',
  ) {
    const auction = await this.auctionModel.findById(auctionId);
    if (!auction) throw new Error('Auction not found');

    if (auction.winnerFactory?.toString() !== factoryId.toString()) {
      throw new Error('You are not the winner');
    }
    //check if payment is done
    const donePayment = await this.paymentModel.findOne({ auction_id: auctionId, status: 'completed' });
    if (donePayment) throw new Error('Payment is already done and auction is completed')

    const amountCents = auction.final_price * 100;

    let payment = null;

    if (paymentMethod === 'cash') {
      payment = await this.paymentModel.create({
        status: 'completed',
        user_id: factoryId,
        auction_id: new Types.ObjectId(auctionId),
        amount: auction.final_price,
        payment_method: paymentMethod,
      });

      auction.is_finished = true;
      await auction.save();
      return { auction };
    }

    if (paymentMethod === 'online') {
      payment = await this.paymentModel.create({
        status: 'pending',
        user_id: factoryId,
        auction_id: new Types.ObjectId(auctionId),
        amount: auction.final_price,
        payment_method: paymentMethod,
      });

      const paymobOrderId = await this.paymobService.registerOrder(
        amountCents,
        payment._id.toString(),
      );

      await this.paymentModel.findByIdAndUpdate(payment._id, {
        paymob_order_id: paymobOrderId,
      });

      const paymentKey = await this.paymobService.getPaymentKey(paymobOrderId, amountCents);

      const iframeUrl = this.paymobService.getIframeUrl(paymentKey);

      auction.is_finished = true;
      await auction.save();

      //update admin wallet
      const admin = await this.userModel.findOne({ role: UserRole.ADMIN });
      if (!admin) throw new NotFoundException(`Admin not found`);

      const adminWallet = await this.userWalletModel.findOne({ userId: admin._id });
      adminWallet.balance += auction.final_price;
      await adminWallet.save();

      await this.walletTransactionModel.create({
        walletId: adminWallet._id,
        userId: admin._id,
        type: 'deposit',
        amount: auction.final_price,
        description: `auction_payment for auction ${auction._id}`,
      });
      return { auction, iframeUrl, payment };
    }
  }

  //check payment is completed or not with payment_id
  async checkPayment(paymentId: string) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    return payment;
  }






}
