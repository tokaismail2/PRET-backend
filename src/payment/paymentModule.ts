// waste.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from '../models/payment.schema';
import { PaymentService } from './paymentService';
import { PaymentController } from './paymentController';
import { User, UserSchema } from '../models/user.schema';
import { UserWallet, UserWalletSchema } from '../models/userWallet.schema';
import { WalletTransaction, WalletTransactionSchema } from '../models/walletTransactions.schema';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  MongooseModule.forFeature([{ name: UserWallet.name, schema: UserWalletSchema }]),
  MongooseModule.forFeature([{ name: WalletTransaction.name, schema: WalletTransactionSchema }]),
  MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
  providers: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule { }
