import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WasteDocument = Waste & Document;


@Schema({ timestamps: true })
export class Waste {
  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true, unique: true })
  warehouse_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
  material_id: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  total_weight: number;

  @Prop({required:true})
  price:number;

  @Prop({ required: true, enum: ['pending', 'in_auction', 'sold'] , default: 'pending'})
  status: string;

  @Prop({required: false})
  description: string;

}

export const WasteSchema = SchemaFactory.createForClass(Waste);
