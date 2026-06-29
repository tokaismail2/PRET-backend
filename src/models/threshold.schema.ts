import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ThresholdDocument = Threshold & Document;

@Schema({ timestamps: true })
export class Threshold {
    @Prop({ required: true })
    material_name: string;

    @Prop({ required: true })
    target_weight: number;
}

export const ThresholdSchema = SchemaFactory.createForClass(Threshold);
