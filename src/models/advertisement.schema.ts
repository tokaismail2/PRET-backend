import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type AdvertisementDocument = Advertisement & Document;

@Schema({ timestamps: true })
export class Advertisement {
  @Prop({ type: [String], default: [] })
  image: string[];
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

}




export const AdvertisementSchema = SchemaFactory.createForClass(Advertisement);
