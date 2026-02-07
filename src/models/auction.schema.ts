import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuctionDocument = Auction & Document;

@Schema({ timestamps: true })
export class Auction {
  @Prop({ required: true })
  waste_id: Types.ObjectId;
  
  @Prop({ required: true })
  start_price: number;

  @Prop({ required: true })
  current_price: number;

  @Prop({ required: true })
  ends_at: Date;

  @Prop({ required: true })
  starts_at: Date;

  @Prop({ default: 'open' })
  status: 'open' | 'closed';

  @Prop({ default: null , ref: 'Factory' })
  winnerFactory?: Types.ObjectId;

  @Prop({ default: null })
    final_price?: number;

}

export const AuctionSchema = SchemaFactory.createForClass(Auction);
