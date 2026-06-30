import { Agenda } from 'agenda';
import { Model, Types } from 'mongoose';
import { Auction, AuctionDocument } from '../../models/auction.schema';
import { AuctionBid, AuctionBidDocument } from '../../models/auctionBids.schema';
import { Waste, WasteDocument } from '../../models/waste.schema';
import { User, UserDocument, UserRole } from '../../models/user.schema';
import { UserWallet, UserWalletDocument } from '../../models/userWallet.schema';
import { WalletTransaction, WalletTransactionDocument } from '../../models/walletTransactions.schema';
import { emitNotification, sendTopicNotification } from '../utils/notifications.system';

export const defineAuctionJobs = (
    agenda: Agenda,
    auctionModel: Model<AuctionDocument>,
    auctionBidModel: Model<AuctionBidDocument>,
    wasteModel: Model<WasteDocument>,
    userModel: Model<UserDocument>,
    userWalletModel: Model<UserWalletDocument>,
    walletTransactionModel: Model<WalletTransactionDocument>,
) => {
    agenda.define('close-auction-if-not-finished', async (job) => {
        const { auctionId } = job.attrs.data;

        // Only act on open auctions that haven't been closed yet
        const auction = await auctionModel.findOne({
            _id: auctionId,
            status: 'open',
            is_finished: false,
        }).lean();

        if (!auction) {
            console.log(`Auction ${auctionId} is already closed or not found — skipping.`);
            return;
        }

        // Find the highest bid
        const highestBid = await auctionBidModel
            .findOne({ auction_id: new Types.ObjectId(auctionId) })
            .sort({ total_price: -1 })
            .lean();

        if (!highestBid) {
            // No bids — close with no winner
            await auctionModel.updateOne(
                { _id: auctionId },
                {
                    status: 'closed',
                    is_finished: true,
                    winnerFactory: null,
                    final_price: null,
                },
            );

            console.log(`Auction ${auctionId} closed with no bids.`);

            emitNotification('auction-closed', {
                auction_id: auctionId.toString(),
                final_price: null,
                winnerFactory: null,
            });

            sendTopicNotification(
                'new_auction_closed',
                'auction-closed',
                JSON.stringify({
                    auction_id: auctionId.toString(),
                    final_price: null,
                    winnerFactory: null,
                }),
            );

            return;
        }

        // ── Close auction with winner ──────────────────────────────────────
        await auctionModel.updateOne(
            { _id: auctionId },
            {
                status: 'closed',
                is_finished: true,
                winnerFactory: highestBid.factory_id,
                final_price: highestBid.total_price,
            },
        );

        // Update waste status to sold
        await wasteModel.updateOne(
            { _id: auction.waste_id },
            { status: 'sold' },
        );

        // ── Notifications ──────────────────────────────────────────────────
        const winnerUser = await userModel.findById(highestBid.factory_id).lean();
        const winnerFactoryName = winnerUser?.name ?? highestBid.factory_id.toString();
        emitNotification('auction-closed', {
            auction_id: auctionId.toString(),
            final_price: highestBid.total_price,
            winnerFactory: winnerFactoryName,
        });

        sendTopicNotification(
            'new_auction_closed',
            'auction-closed',
            JSON.stringify({
                auction_id: auctionId.toString(),
                final_price: highestBid.total_price,
                winnerFactory: winnerFactoryName,
            }),
        );

        console.log(`Auction ${auctionId} closed — winner: ${highestBid.factory_id}, price: ${highestBid.total_price}`);

        // ── Credit admin wallet ────────────────────────────────────────────
        const admin = await userModel.findOne({ role: UserRole.ADMIN }).lean();
        if (!admin) {
            console.error(`Auction ${auctionId}: admin user not found — wallet not credited.`);
        } else {
            const adminWallet = await userWalletModel.findOne({ userId: admin._id });
            if (!adminWallet) {
                console.error(`Auction ${auctionId}: admin wallet not found — wallet not credited.`);
            } else {
                adminWallet.balance += highestBid.total_price;
                await adminWallet.save();

                const adminTx = new walletTransactionModel({
                    walletId: adminWallet._id,
                    userId: admin._id,
                    type: 'deposit',
                    amount: highestBid.total_price,
                    description: `Deposit for auction ${auction._id} (auto-close)`,
                });
                await adminTx.save();
            }
        }

        // ── Debit factory wallet ───────────────────────────────────────────
        const factoryWallet = await userWalletModel.findOne({ userId: highestBid.factory_id });
        if (!factoryWallet) {
            console.error(`Auction ${auctionId}: factory wallet not found for ${highestBid.factory_id}.`);
        } else {
            factoryWallet.balance -= highestBid.total_price;
            await factoryWallet.save();

            const factoryTx = new walletTransactionModel({
                walletId: factoryWallet._id,
                userId: highestBid.factory_id,
                type: 'withdrawal',
                amount: highestBid.total_price,
                description: `Withdrawal for auction ${auction._id} from factory (auto-close)`,
            });
            await factoryTx.save();
        }
    });
};
