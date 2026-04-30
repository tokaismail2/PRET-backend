import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {Agenda} from 'agenda';
import mongoose, { Model } from 'mongoose';
export type AuctionDocument = Auction & Document;

@Schema({ timestamps: true })
export class Auction {
  @Prop({ required: true, ref: 'Waste' })
  waste_id: Types.ObjectId;

  @Prop({ required: true, ref: 'Warehouse' })
  warehouse_id: Types.ObjectId;

  @Prop({ required: true })
  image: string;

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

  @Prop({ default: null, ref: 'User' })
  winnerFactory?: Types.ObjectId;

  @Prop({ default: null })
  final_price?: number;

  @Prop({ default: false })
  is_finished?: boolean;

}




export const AuctionSchema = SchemaFactory.createForClass(Auction);
