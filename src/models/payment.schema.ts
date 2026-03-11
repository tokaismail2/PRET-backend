import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
    @Prop({ required: true, enum: ['cash', 'online'] })
    payment_method: string;

    @Prop({ required: true, enum: ['pending', 'completed'], default: 'pending' })
    status: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true, ref: 'User' })
    user_id: Types.ObjectId;

    @Prop({ required: false, ref: 'Auction' })
    auction_id?: Types.ObjectId;

    @Prop({ required: false, ref: 'Waste' })
    waste_id?: Types.ObjectId;

    @Prop({ required: false })
    paymob_order_id?: number;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
