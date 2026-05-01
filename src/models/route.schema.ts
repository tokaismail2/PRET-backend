import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RouteDocument = Route & Document;

@Schema({ _id: false })
class OrderStatusSubDoc {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  id: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'assigned', 'completed'],
  })
  status: string;
}

@Schema({ timestamps: true })
export class Route {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  driver: Types.ObjectId;

  @Prop({
    type: [OrderStatusSubDoc],
    required: true,
    default: [],
  })
  orderIds: {
    id: Types.ObjectId;
    status: string;
  }[];

  @Prop({ type: Types.ObjectId, ref: 'Warehouse' })
  destination: Types.ObjectId;

  @Prop({ type: { latitude: Number, longitude: Number } })
  startPoint: { latitude: number; longitude: number };

  @Prop({ type: Number })
  distance: number;

}

export const RouteSchema = SchemaFactory.createForClass(Route);