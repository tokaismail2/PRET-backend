import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WasteDocument = Waste & Document;

export enum WasteType {
  PLASTIC = 'plastic',
  PAPER = 'paper',
  METAL = 'metal',
  ORGANIC = 'organic',
  GLASS = 'glass',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Waste {
  @Prop({ required: true, enum: WasteType })
  type: WasteType;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true })
  restaurant: string;

  @Prop({ default: Date.now })
  collectedAt: Date;

  @Prop({ default: '' })
  description?: string;

  @Prop({ default: '' })
  image?: string;

  @Prop({ default: '' })
  location?: string;
}

export const WasteSchema = SchemaFactory.createForClass(Waste);
