import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type DonationDocument = Donation & Document;

export enum DonationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Donation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  donor: Types.ObjectId | User;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  charity?: Types.ObjectId | User;

  @Prop({ required: true, min: 1 })
  mealsProvided: number;

  @Prop({ type: [String], default: [] })
  photos: string[]; // URLs to meal photos (up to 3)

  @Prop({
    required: true,
    type: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
  })

  @Prop({
    required: true,
    enum: DonationStatus,
    default: DonationStatus.PENDING,
  })
  status: DonationStatus;

  @Prop()
  scheduledPickupDate?: Date;

  @Prop()
  actualPickupDate?: Date;

  @Prop()
  notes?: string;

  @Prop()
  rejectionReason?: string;

  @Prop({ min: 0, max: 5 })
  donorRating?: number;

  @Prop()
  donorReview?: string;

  @Prop({ min: 0, max: 5 })
  charityRating?: number;

  @Prop()
  charityReview?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DonationSchema = SchemaFactory.createForClass(Donation);

