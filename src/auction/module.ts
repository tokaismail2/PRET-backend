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


export class AppModule {}
@Module({
  imports: [HttpModule,
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
<<<<<<< HEAD
  controllers: [AuctionController, AiController],
  providers: [AuctionService, AiService],
=======
  controllers: [AuctionController],
  providers: [AuctionService, PaymobService],
>>>>>>> e24003bc3ee4e25cf12588747deccf28a164291c
})
export class AuctionModule {}
