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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: Waste.name, schema: WasteSchema },
      { name: AuctionBid.name, schema: AuctionBidSchema },
      { name: User.name, schema: UserSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
    ]),
  ],
  controllers: [AuctionController],
  providers: [AuctionService],
})
export class AuctionModule {}
