import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Auction, AuctionSchema } from '../models/auction.schema';
import { AuctionService } from './service';
import { AuctionController } from './controller';
import { Waste, WasteSchema } from '../models/waste.schema';
import { AuctionBid, AuctionBidSchema } from '../models/auctionBids.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: Waste.name, schema: WasteSchema },
      { name: AuctionBid.name, schema: AuctionBidSchema },
    ]),
  ],
  controllers: [AuctionController],
  providers: [AuctionService],
})
export class AuctionModule {}
