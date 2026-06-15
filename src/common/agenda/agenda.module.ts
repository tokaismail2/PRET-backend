import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgendaService } from './agenda.service';
import { Order, OrderSchema } from '../../models/order.schema';
import { User, UserSchema } from '../../models/user.schema';
import { Auction, AuctionSchema } from '../../models/auction.schema';
import { AuctionBid, AuctionBidSchema } from '../../models/auctionBids.schema';
import { Waste, WasteSchema } from '../../models/waste.schema';
import { UserWallet, UserWalletSchema } from '../../models/userWallet.schema';
import { WalletTransaction, WalletTransactionSchema } from '../../models/walletTransactions.schema';
import { Route, RouteSchema } from '../../models/route.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    MongooseModule.forFeature([{ name: Auction.name, schema: AuctionSchema }]),
    MongooseModule.forFeature([{ name: AuctionBid.name, schema: AuctionBidSchema }]),
    MongooseModule.forFeature([{ name: Waste.name, schema: WasteSchema }]),
    MongooseModule.forFeature([{ name: UserWallet.name, schema: UserWalletSchema }]),
    MongooseModule.forFeature([{ name: WalletTransaction.name, schema: WalletTransactionSchema }]),
    MongooseModule.forFeature([{ name: Route.name, schema: RouteSchema }]),
  ],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}