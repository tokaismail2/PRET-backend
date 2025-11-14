import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  GENERATOR = 'generator',
  FACTORY = 'factory',
  ADMIN = 'admin',
}

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
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.GENERATOR })
  role: UserRole;

  @Prop({ enum: GeneratorType })
  generatorType?: GeneratorType;

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
  })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  profilePicture?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
