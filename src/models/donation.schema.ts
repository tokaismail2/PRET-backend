import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type DonationDocument = Donation & Document;

export enum DonationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted'
}

@Schema({ timestamps: true })
export class Donation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  generator: Types.ObjectId | User;

  @Prop({ type: String })
  charity?: string;

  @Prop({ type: String })
  notes?: string;

  @Prop({ required: true, min: 1 })
  mealsProvided: number;

  @Prop({ type: [String], default: [] })
  images: string[]; // URLs to meal photos (up to 3)


  @Prop({
    required: true,
    enum: DonationStatus,
    default: DonationStatus.PENDING,
  })
  status: DonationStatus;
}

export const DonationSchema = SchemaFactory.createForClass(Donation);

