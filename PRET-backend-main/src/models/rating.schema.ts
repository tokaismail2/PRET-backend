import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RatingDocument = Rating & Document;

@Schema({ timestamps: true })
export class Rating {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ required: true })
    targetId: string; // orderId أو donationId

    @Prop({ min: 1, max: 5, required: true })
    value: number;

    @Prop()
    comment?: string;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
