import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserWalletDocument = UserWallet & Document;

@Schema({ timestamps: true }) 
export class UserWallet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  balance: number;
}

export const UserWalletSchema = SchemaFactory.createForClass(UserWallet);
