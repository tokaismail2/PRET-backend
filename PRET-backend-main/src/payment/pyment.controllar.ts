import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  // 💳 create payment
  @Post()
  create(@Body() dto: CreatePaymentDto, @Req() req) {
    return this.paymentService.create(dto, req.user.id);
  }

  // ✅ confirm payment (webhook / admin)
  @Patch(':id/confirm')
  confirm(
    @Param('id') paymentId: string,
    @Body('transactionId') transactionId: string,
  ) {
    return this.paymentService.confirm(paymentId, transactionId);
  }

  // ❌ payment failed
  @Patch(':id/fail')
  fail(@Param('id') paymentId: string) {
    return this.paymentService.fail(paymentId);
  }
}
