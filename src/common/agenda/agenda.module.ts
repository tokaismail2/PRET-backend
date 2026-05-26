import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgendaService } from './agenda.service';
import { Order, OrderSchema } from '../../models/order.schema';
import { User, UserSchema } from '../../models/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}