import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Auction, AuctionSchema } from '../models/auction.schema';
import { AuctionService } from './service';
import { AuctionController } from './controller';
import { Waste, WasteSchema } from '../models/waste.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: Waste.name, schema: WasteSchema },
    ]),
  ],
  controllers: [AuctionController],
  providers: [AuctionService],
})
export class AuctionModule {}
