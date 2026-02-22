// waste.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Waste, WasteSchema } from '../models/waste.schema';
import { WasteService } from './wasteService';
import { WasteController } from './wasteController';
import { User, UserSchema } from '../models/user.schema';
import { UserWallet, UserWalletSchema } from '../models/userWallet.schema';
import { WalletTransaction, WalletTransactionSchema } from '../models/walletTransactions.schema';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Waste.name, schema: WasteSchema }]),
  MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  MongooseModule.forFeature([{ name: UserWallet.name, schema: UserWalletSchema }]),
  MongooseModule.forFeature([{ name: WalletTransaction.name, schema: WalletTransactionSchema }]),
  MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
  providers: [WasteService],
  controllers: [WasteController],
})
export class WasteModule { }
