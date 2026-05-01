//create generator dashboard service

import { NotFoundException } from "@nestjs/common";
import { User, UserDocument } from "../models/user.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Order, OrderDocument } from "../models/order.schema";
import { UserWallet, UserWalletDocument } from "../models/userWallet.schema";
import { WalletTransaction, WalletTransactionDocument } from "../models/walletTransactions.schema";
import { AuditLog, AuditLogDocument } from "../models/auditLog.schema";
import mongoose from "mongoose";
import { AuctionBid, AuctionBidDocument } from "../models/auctionBids.schema";
import { Auction, AuctionDocument } from "../models/auction.schema";
import { Donation, DonationDocument } from "../models/donation.schema";
import { Payment, PaymentDocument } from "../models/payment.schema";

export class DashboardService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(UserWallet.name) private walletModel: Model<UserWalletDocument>,
        @InjectModel(WalletTransaction.name) private walletTransactionModel: Model<WalletTransactionDocument>,
        @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
        @InjectModel(AuctionBid.name) private bidModel: Model<AuctionBidDocument>,
        @InjectModel(Auction.name) private auctionModel: Model<AuctionDocument>,
        @InjectModel(Donation.name) private donationModel: Model<DonationDocument>,
        @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    ) { }

    async getGeneratorDashboard(userId: string, startDate?: string, endDate?: string) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const now = new Date();

        const startOfMonth = startDate
            ? new Date(startDate)
            : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const endOfMonth = endDate
            ? new Date(new Date(endDate).setUTCHours(23, 59, 59, 999))
            : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

        const userObjectId = new mongoose.Types.ObjectId(userId);

        //Total Orders this month
        const totalCompletedOrdersAtCurrentMonth = await this.orderModel.countDocuments({
            generatorId: userObjectId,
            status: 'completed',
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });
        const totalOrdersAtCurrentMonth = await this.orderModel.countDocuments({
            generatorId: userObjectId,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });

        //Total Donations this month
        const totalDonationsAtCurrentMonth = await this.orderModel.countDocuments({
            generatorId: userObjectId,  // fix: was 'generator'
            type: 'donation',           // adjust field based on your schema
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });

        //Wallet Revenue this month
        const wallet = await this.walletModel.findOne({ userId: userObjectId });
        let totalRevenueAtCurrentMonth = 0;

        if (wallet) {
            const revenueResult = await this.walletTransactionModel.aggregate([
                {
                    $match: {
                        walletId: wallet._id,
                        type: 'deposit',
                        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$amount' },
                    },
                },
            ]);
            totalRevenueAtCurrentMonth = revenueResult[0]?.totalRevenue ?? 0;
        }

        //Material Chart Data
        const materialChartData = await this.orderModel.aggregate([
            {
                $match: {
                    generatorId: userObjectId,
                    status: 'completed',
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: '$materialTypeId',
                    totalQuantity: { $sum: '$quantity' },
                },
            },
            {
                $addFields: {
                    materialObjectId: { $toObjectId: '$_id' },
                },
            },
            {
                $lookup: {
                    from: 'materials',
                    localField: 'materialObjectId',
                    foreignField: '_id',
                    as: 'material',
                },
            },
            { $unwind: '$material' },
            {
                $project: {
                    _id: 0,
                    materialName: '$material.name',
                    totalQuantity: 1,
                },
            },
            { $sort: { totalQuantity: -1 } },
        ]);

        //number of orders 
        const numberOfOrdersChart = await this.orderModel.aggregate([
            {
                $match: {
                    generatorId: userObjectId,
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $gt: [{ $subtract: [endOfMonth, startOfMonth] }, 1000 * 60 * 60 * 24 * 31] },
                            then: { $month: '$createdAt' },
                            else: { $dayOfMonth: '$createdAt' },
                        },
                    },
                    label: {
                        $first: {
                            $cond: {
                                if: { $gt: [{ $subtract: [endOfMonth, startOfMonth] }, 1000 * 60 * 60 * 24 * 31] },
                                then: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                                else: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            },
                        },
                    },
                    totalOrders: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    date: '$label',
                    totalOrders: 1,
                },
            },
            { $sort: { date: 1 } },

            {
                $group: {
                    _id: null,
                    items: { $push: '$$ROOT' },
                },
            },
            {
                $project: {
                    _id: 0,
                    items: {
                        $cond: {
                            if: { $gt: [{ $subtract: [endOfMonth, startOfMonth] }, 1000 * 60 * 60 * 24 * 31] },
                            then: { $slice: ['$items', 2] },
                            else: '$items',
                        },
                    },
                },
            },
            { $unwind: '$items' },
            { $replaceRoot: { newRoot: '$items' } },
        ]);

        const totalKg = materialChartData.reduce((sum, item) => sum + item.totalQuantity, 0);
        const chartData = materialChartData.map((item) => ({
            name: item.materialName,
            quantity: item.totalQuantity,
            percentage: totalKg > 0 ? parseFloat(((item.totalQuantity / totalKg) * 100).toFixed(1)) : 0,
        }));

        //Last 5 Audit Logs
        const recentActivity = await this.auditLogModel
            .find({ user: userObjectId })
            .sort({ createdAt: -1 })
            .limit(5);
        return {
            totalOrdersAtCurrentMonth,
            totalCompletedOrdersAtCurrentMonth,
            totalDonationsAtCurrentMonth,
            totalRevenueAtCurrentMonth,
            topRecycledMaterials: {
                totalKg,
                materials: chartData,
            },

            numberOfOrdersChart,
            recentActivity,

        };
    }

    async getFactoryDashboard(userId: string, startDate?: string, endDate?: string) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const now = new Date();

        const startOfMonth = startDate
            ? new Date(startDate)
            : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const endOfMonth = endDate
            ? new Date(new Date(endDate).setUTCHours(23, 59, 59, 999))
            : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

        const userObjectId = new mongoose.Types.ObjectId(userId);

        const totalBidsAtCurrentMonth = await this.bidModel.countDocuments({
            factory_id: userObjectId,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });

        const totalWinsAtAuctions = await this.auctionModel.countDocuments({
            winnerFactory: userObjectId,
            status: 'closed',
        });

        const activeAuctions = await this.auctionModel.countDocuments({
            status: 'open',
        });

        const totalWeightOfWaste = await this.auctionModel.aggregate([
            {
                $match: {
                    winnerFactory: userObjectId,
                    status: 'closed',
                },
            },
            {
                $addFields: {
                    waste_id: '$waste_id',
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
            {
                $unwind: '$waste',
            },
            {
                $group: {
                    _id: '$waste_id',
                    totalWeight: { $sum: '$waste.total_weight' },
                },
            },
        ]);

        //Wallet spent this month
        const wallet = await this.walletModel.findOne({ userId: userObjectId });
        let totalSpentAtCurrentMonth = 0;

        if (wallet) {
            const revenueResult = await this.walletTransactionModel.aggregate([
                {
                    $match: {
                        walletId: wallet._id,
                        type: 'withdrawal',
                        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$amount' },
                    },
                },
            ]);
            totalSpentAtCurrentMonth = revenueResult[0]?.totalRevenue ?? 0;
        }

        //Last 5 Audit Logs
        const recentActivity = await this.auditLogModel
            .find({ user: userObjectId })
            .sort({ createdAt: -1 })
            .limit(5);

        //last 5 payments 
        const recentPayments = await this.paymentModel.find({
            user_id: userObjectId,
        }).sort({ createdAt: -1 }).limit(5);

        //each matrial and weight 
        const materialChartData = await this.auctionModel.aggregate([
            {
                $match: {
                    winnerFactory: userObjectId,
                    status: 'closed',
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
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
            {
                $unwind: '$waste',
            },
            {
                $lookup: {
                    from: 'materials',
                    localField: 'waste.material_id',
                    foreignField: '_id',
                    as: 'material',
                },
            },
            {
                $unwind: '$material',
            },
            {
                $group: {
                    _id: '$waste.material_id',
                    materialName: { $first: '$material.name' },
                    totalWeight: { $sum: '$waste.total_weight' },
                },
            },
        ]);

        return {
            totalBidsAtCurrentMonth,
            totalWinsAtAuctions,
            activeAuctions,
            totalWeightOfWaste: totalWeightOfWaste.reduce((sum, item) => sum + item.totalWeight, 0),
            totalSpentAtCurrentMonth,
            recentActivity,
            recentPayments,
            materialChartData,
        };





    }

    async getDriverDashboard(userId: string, startDate?: string, endDate?: string) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const now = new Date();

        const startOfMonth = startDate
            ? new Date(startDate)
            : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const endOfMonth = endDate
            ? new Date(new Date(endDate).setUTCHours(23, 59, 59, 999))
            : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

        const userObjectId = new mongoose.Types.ObjectId(userId);

        const totalOrdersAtCurrentMonth = await this.orderModel.countDocuments({
            driverId: userObjectId,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });

        const totalCompletedOrdersAtCurrentMonth = await this.orderModel.countDocuments({
            driverId: userObjectId,
            status: 'completed',
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });


        const totalRevenueAtCurrentMonth = await this.walletTransactionModel.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    type: 'withdrawal',
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $project: {
                    _id: 0,
                    amount: 1,
                    createdAt: 1,
                },
            },
        ]);

        const ordersPerDay = await this.orderModel.aggregate([
            {
                $match: {
                    driverId: userObjectId,
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    count: 1,
                },
            },
        ]);


        //Last 5 Audit Logs
        const recentActivity = await this.auditLogModel
            .find({ user: userObjectId })
            .sort({ createdAt: -1 })
            .limit(5);
        return {
            totalOrdersAtCurrentMonth,
            totalCompletedOrdersAtCurrentMonth,
            totalRevenueAtCurrentMonth,
             ordersPerDay,
            recentActivity,
        };
    }

    async getAdminDashboard(startDate?: Date, endDate?: Date) {
        const now = new Date();
        const startOfMonth = startDate
            ? new Date(startDate)
            : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const endOfMonth = endDate
            ? new Date(new Date(endDate).setUTCHours(23, 59, 59, 999))
            : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

        const filter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };

        const totalDonations = await this.donationModel.countDocuments(filter);
        const totalOrders = await this.orderModel.countDocuments(filter);
        const totalCompletedOrders = await this.orderModel.countDocuments({ ...filter, status: 'completed' });

        const totalUsers = await this.userModel.countDocuments();
        const totalDrivers = await this.userModel.countDocuments({ role: 'driver' });
        const totalFactories = await this.userModel.countDocuments({ role: 'factory' });
        const totalGenerators = await this.userModel.countDocuments({ role: 'generator' });
        const totalRevenue = await this.walletTransactionModel.aggregate([
            {
                $match: {
                    type: { $in: ['deposit', 'withdrawal'] },
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: null,
                    totalDeposits: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0],
                        },
                    },
                    totalWithdrawals: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalDeposits: 1,
                    totalWithdrawals: 1,
                    totalRevenue: { $subtract: ['$totalWithdrawals', '$totalDeposits'] },
                },
            },
        ]);


        // generators with number of orders
        const generatorData = await this.orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: '$generatorId',
                    totalOrders: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'generator',
                },
            },
            {
                $unwind: '$generator',
            },
            {
                $project: {
                    _id: 1,
                    totalOrders: 1,
                    generatorName: '$generator.name',
                },
            },
            {
                $sort: { totalOrders: -1 },
            },
        ]);

        // factories with number of auctions they won
        const factoriesData = await this.auctionModel.aggregate([
            {
                $match: {
                    winnerFactory: { $exists: true, $ne: null },
                    status: 'closed',
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: '$winnerFactory',
                    totalWins: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'factory',
                },
            },
            {
                $unwind: '$factory',
            },
            {
                $project: {
                    _id: 1,
                    totalWins: 1,
                    factoryName: '$factory.name',
                },
            },
            {
                $sort: { totalWins: -1 },
            },
        ]);
        return {
            totalUsers,
            totalDrivers,
            totalFactories,
            totalGenerators,
            totalDonations,
            totalOrders,
            totalCompletedOrders,
            totalRevenue,
            generatorData,
            factoriesData,

        };
    }
}
