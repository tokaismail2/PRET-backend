import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  GENERATOR = 'generator',
  FACTORY = 'factory',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true , sparse: true})
  email: string;

  @Prop({ required: function () { return !this.authProvider || this.authProvider === 'email'; } })
  password?: string;

  @Prop({ enum: ['email', 'google'], default: 'email' })
  authProvider?: 'email' | 'google';

  @Prop()
  googleId?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, sparse: true, trim: true })
  phone?: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.GENERATOR })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({default: false})
  isVerified: boolean;

  @Prop()
  profilePicture?: string;

  @Prop({ select: false })
  __v: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
