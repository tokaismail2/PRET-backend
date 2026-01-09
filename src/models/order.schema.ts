import { Driver } from './driver.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type OrderDocument = Order & Document;

export enum MaterialType {
  PLASTIC = 'plastic',
  PAPER = 'paper',
  METAL = 'metal',
  GLASS = 'glass',
  ELECTRONICS = 'electronics',
  ORGANIC = 'organic',
  TEXTILES = 'textiles',
  OTHER = 'other',
}
export enum OrderStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',

}
@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyer: Types.ObjectId | User;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  seller?: Types.ObjectId | User;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  driverId?: Types.ObjectId | User;

  @Prop({ required: true, enum: MaterialType })
  materialType: MaterialType;

  @Prop({ required: true, min: 0 })
  quantity: number; // in kg or tons

  @Prop({ required: true })
  unit: string; // 'kg', 'tons', etc.

  @Prop({ min: 0 })
  price?: number; // price per unit

  @Prop({ min: 0 })
  totalPrice?: number;

  @Prop({ type: [String], default: [] })
  photos?: string[]; // URLs to photos (up to 3)

  @Prop({
    required: true,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Prop({
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
  pickupLocation?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };

  @Prop({
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
  deliveryLocation?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };

  @Prop()
  scheduledPickupDate?: Date;

  @Prop()
  scheduledDeliveryDate?: Date;

  @Prop()
  actualPickupDate?: Date;

  @Prop()
  actualDeliveryDate?: Date;

  @Prop()
  notes?: string;

  @Prop()
  rejectionReason?: string;

  @Prop({ min: 0, max: 5 })
  buyerRating?: number;

  @Prop()
  buyerReview?: string;

  @Prop({ min: 0, max: 5 })
  sellerRating?: number;

  @Prop()
  sellerReview?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);