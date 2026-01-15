import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuctionBidDocument = AuctionBid & Document;

@Schema({ timestamps: true })
export class AuctionBid {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Auction' })   
  auction_id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Factory' })
  factory_id: Types.ObjectId;
  
  @Prop({ required: true })
  price_per_kg: number;


}

export const AuctionBidSchema = SchemaFactory.createForClass(AuctionBid);
