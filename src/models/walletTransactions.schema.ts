import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as crypto from 'crypto';

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

  @Prop({ required: false })
  transactionId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: false })
  orderId: Types.ObjectId;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);

WalletTransactionSchema.pre<WalletTransactionDocument>('save', function (next: any) {
  if (this.isNew) {
    this.transactionId = crypto.randomInt(10000000, 99999999).toString();
  }
  next();
});