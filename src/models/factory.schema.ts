import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type FactoryDocument = Factory & Document;

@Schema({ timestamps: true })
export class Factory {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
    user: User | MongooseSchema.Types.ObjectId;

    @Prop({
        type: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
            coordinates: {
                latitude: Number,
                longitude: Number,
            },
        },
        required: true,
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
}

export const FactorySchema = SchemaFactory.createForClass(Factory);
