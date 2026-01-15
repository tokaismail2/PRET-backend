import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from '../models/order.schema';
import { User, UserSchema } from '../models/user.schema';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';
import { ImageKitModule } from '../imagekit/imagekit.module';
import { PassportModule } from '@nestjs/passport';
import { UserWallet, UserWalletSchema } from '../models/userWallet.schema';
import { WalletTransaction, WalletTransactionSchema } from '../models/walletTransactions.schema';
import { WarehouseReceipt, WarehouseReceiptSchema } from '../models/warehouseReceipt.schema';
import { Warehouse, WarehouseSchema } from '../models/warehouse.schema';
import { Generator, GeneratorSchema } from '../models/generator.schema';
import { MaterialModule } from '../materialType/material.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: WarehouseReceipt.name, schema: WarehouseReceiptSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: Generator.name, schema: GeneratorSchema },
    ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
    ImageKitModule,
    MaterialModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule { }
