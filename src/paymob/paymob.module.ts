import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymobService } from './paymob.service';
import { PaymobController } from './paymob.controller';

import { Payment, PaymentSchema } from '../models/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
  providers: [PaymobService],
  controllers: [PaymobController],
  exports: [PaymobService],
})
export class PaymobModule {}