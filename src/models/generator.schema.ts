import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GeneratorDocument = Generator & Document;

export enum GeneratorType {
    HOTEL = 'hotel',
    RESTAURANT = 'restaurant',
    CAFE = 'cafe',
    OFFICE = 'office',
    RESIDENTIAL = 'residential',
    WAREHOUSE = 'warehouse',
    OTHER = 'other',
}

@Schema({ timestamps: true })
export class Generator {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ required: true, enum: GeneratorType })
    generatorType: GeneratorType;

    @Prop({ required: true })
    businessName: string;

    @Prop({
        type: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            zipCode: { type: String },
            country: { type: String },
            coordinates: {
                _id: false,
                latitude: { type: Number },
                longitude: { type: Number },
            },
            _id: false,
        },
        required: false,
    })
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };

    @Prop()
    logo?: string;
}

export const GeneratorSchema = SchemaFactory.createForClass(Generator);