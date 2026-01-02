import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WarehouseReceiptDocument = WarehouseReceipt & Document;

@Schema({ timestamps: true })
export class WarehouseReceipt {
  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouse_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  waste_order_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) // نفترض الدرايفر هو User
  driver_id: Types.ObjectId;

  @Prop({ required: true })
  received_weight: number;

  @Prop({ required: true })
  price_per_kg: number;

  @Prop({ required: true })
  total_amount: number;

  @Prop({ required: true })
  received_at: Date;

  @Prop()
  notes?: string;
}

export const WarehouseReceiptSchema = SchemaFactory.createForClass(WarehouseReceipt);
