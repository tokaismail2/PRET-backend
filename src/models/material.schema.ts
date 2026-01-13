import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MaterialDocument = Material & Document;

@Schema({ timestamps: true })
export class Material {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    price: number;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
