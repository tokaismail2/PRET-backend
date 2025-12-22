import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RatingDocument = Rating & Document;

@Schema({ timestamps: true })
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  targetId: string;

  @Prop({ required: true, enum: ['order', 'donation'] })
  targetType: string;

  @Prop({ required: true, min: 1, max: 5 })
  value: number;

  @Prop()
  comment?: string;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
