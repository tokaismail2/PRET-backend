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
import { Material, MaterialSchema } from '../models/material.schema';
import { Route, RouteSchema } from '../models/route.schema';
import { AgendaModule } from '../common/agenda/agenda.module';


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
      { name: Material.name, schema: MaterialSchema },
      { name: Route.name, schema: RouteSchema },
    ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
    ImageKitModule,
    MaterialModule,
    AgendaModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule { }
