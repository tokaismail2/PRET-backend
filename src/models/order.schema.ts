import { Driver } from './driver.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';
import { Warehouse } from './warehouse.schema';
import { Material } from './material.schema';

export type OrderDocument = Order & Document;


export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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

  @Prop({ type: Types.ObjectId, ref: 'Warehouse' })
  warehouseId?: Types.ObjectId | Warehouse;

  @Prop({ type: Types.ObjectId, ref: 'Material' })
  materialTypeId: Types.ObjectId | Material;

  @Prop({ required: true, min: 0 })
  quantity: number; // in kg or tons

  @Prop({ required: true })
  unit: string; // 'kg', 'tons', etc.

  @Prop({ min: 0 })
  price?: number; // price per unit

  @Prop({ min: 0 })
  totalPrice?: number;



  @Prop()
  notes?: string;

  @Prop({ type: [String], default: [] })
  photos?: string[]; // URLs to photos (up to 3)

  @Prop({
    required: true,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);