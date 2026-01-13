import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document , Types } from 'mongoose';

export type WalletTransactionDocument = WalletTransaction & Document;

@Schema({ timestamps: true }) 
export class WalletTransaction {

  @Prop({ type: Types.ObjectId, ref: 'UserWallet', required: true })
  walletId: Types.ObjectId;
  
  //if withdrawal then amount is negative and if deposit then amount is positive
  //بيدفع يبقى withdrawal
  //بياخد يبقى deposit
  @Prop({ enum: ['withdrawal', 'deposit'], required: true })
  type: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  description: string;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);
