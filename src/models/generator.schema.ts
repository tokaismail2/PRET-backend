import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

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
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
    user: User | MongooseSchema.Types.ObjectId;

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
