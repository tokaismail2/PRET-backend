import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DriverDocument = Driver & Document;


@Schema({ timestamps: true })
export class Driver {

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: function() { return !this.authProvider || this.authProvider === 'email'; } })
  password?: string;

  @Prop({ enum: ['email', 'google'], default: 'email' })
  authProvider?: 'email' | 'google';

  @Prop({ required: false })
  latitude?: number;

  @Prop({ required: false })
  longitude?: number;

  @Prop()
  googleId?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, sparse: true, trim: true })
  phone?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  profilePicture?: string;


}

export const DriverSchema = SchemaFactory.createForClass(Driver);
