import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './pyment.controllar';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from '../models/payment.schema';
import { Order, OrderSchema } from '../models/order.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Payment.name, schema: PaymentSchema },
            { name: Order.name, schema: OrderSchema },
        ]),
    ],
    controllers: [PaymentController],
    providers: [PaymentService],
})
export class PaymentModule { }
