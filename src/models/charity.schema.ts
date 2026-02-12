import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CharityDocument = Charity & Document;

@Schema({ timestamps: true })
export class Charity {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true})
  address: string;
}

export const CharitySchema = SchemaFactory.createForClass(Charity);

