import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RouteDocument = Route & Document;

@Schema({ timestamps: true })
export class Route {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    driver: Types.ObjectId;

    @Prop({ type: [Types.ObjectId], ref: 'Order', required: true })
    orderIds: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
    destination: Types.ObjectId;

    @Prop({ type: { latitude: Number, longitude: Number }, required: true })
    startPoint: { latitude: number; longitude: number };

    @Prop({ type: Number, required: true })
    distance: number;

}
export const RouteSchema = SchemaFactory.createForClass(Route);

