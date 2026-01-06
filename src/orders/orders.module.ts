import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from '../models/order.schema';
import { User, UserSchema } from '../models/user.schema';
import { Driver, DriverSchema } from '../models/driver.schema';
import { AuditLog, AuditLogSchema } from '../models/auditLog.schema';
import { ImageKitModule } from '../imagekit/imagekit.module';
import { PassportModule } from '@nestjs/passport';
import { DriverJwtStrategy } from '../DriverAuth/strategies/jwtForDriver.strategy'; // صحح المسار حسب مكان الملف

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Driver.name, schema: DriverSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'driver-jwt' }),
    ImageKitModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, DriverJwtStrategy], // <-- ضيف هنا
  exports: [OrdersService],
})
export class OrdersModule {}
