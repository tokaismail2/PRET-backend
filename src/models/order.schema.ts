
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Model } from 'mongoose';
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
  generatorId: Types.ObjectId | User;

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

  @Prop()
  orderCode: string;


  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

//create code of order from 6 digits random and unique

OrderSchema.pre('save', async function () {
  if (!this.orderCode) {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const existingOrder = await (this.constructor as Model<OrderDocument>).findOne({ orderCode: code, status: OrderStatus.PENDING });
      if (!existingOrder) {
        isUnique = true;
        this.orderCode = code;
      }
    }
  }
});
