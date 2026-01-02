import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuctionDocument = Auction & Document;

@Schema({ timestamps: true })
export class Auction {
  @Prop({ required: true })
  wasteType: string;

  @Prop({ required: true })
  totalQuantity: number;

  @Prop({ default: 'open' })
  status: 'open' | 'closed';

  @Prop({
    type: [
      {
        factory: String,
        price: Number,
      },
    ],
    default: [],
  })
  bids: {
    factory: string;
    price: number;
  }[];

  @Prop({ default: null })
  winnerFactory?: string;
}

export const AuctionSchema = SchemaFactory.createForClass(Auction);
