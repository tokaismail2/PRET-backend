import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Auction, AuctionSchema } from '../models/auction.schema';
import { AuctionService } from './service';
import { AuctionController } from './controller';
import { Waste, WasteSchema } from '../models/waste.schema';
import { AuctionBid, AuctionBidSchema } from '../models/auctionBids.schema';
import { User, UserSchema } from '../models/user.schema';
import { UserWallet, UserWalletSchema } from '../models/userWallet.schema';
import { WalletTransaction, WalletTransactionSchema } from '../models/walletTransactions.schema';
import { ImageKitModule } from '../imagekit/imagekit.module';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';
import { Payment, PaymentSchema } from '../models/payment.schema';
import { PaymobService } from '../paymob/paymob.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: Waste.name, schema: WasteSchema },
      { name: AuctionBid.name, schema: AuctionBidSchema },
      { name: User.name, schema: UserSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
    ImageKitModule,
  ],
  controllers: [AuctionController],
  providers: [AuctionService, PaymobService],
})
export class AuctionModule {}
