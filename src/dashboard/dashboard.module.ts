import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order, OrderSchema } from '../models/order.schema';
import { Donation, DonationSchema } from '../models/donation.schema';
import { User, UserSchema } from '../models/user.schema';
import { UserWallet, UserWalletSchema } from '../models/userWallet.schema';
import { WalletTransaction, WalletTransactionSchema } from '../models/walletTransactions.schema';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';
import { AuctionBid, AuctionBidSchema } from '../models/auctionBids.schema';
import { Auction, AuctionSchema } from '../models/auction.schema';
import { Payment, PaymentSchema } from '../models/payment.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema },
            { name: Donation.name, schema: DonationSchema },
            { name: User.name, schema: UserSchema },
            { name: UserWallet.name, schema: UserWalletSchema },
            { name: WalletTransaction.name, schema: WalletTransactionSchema },
            { name: AuditLog.name, schema: AuditLogSchema },
            { name: AuctionBid.name, schema: AuctionBidSchema },
            { name: Auction.name, schema: AuctionSchema },
            { name: Payment.name, schema: PaymentSchema },
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule { }

