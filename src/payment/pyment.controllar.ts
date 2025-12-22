import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  Patch,
  UseGuards,
  Get,
  Delete,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // 👀 Get all payments (admin)
  @Get()
  async findAll() {
    return this.paymentService.findAll();
  }

  // 👤 Get my payments (user)
  @Get('me')
  async findMine(@Req() req) {
    return this.paymentService.findMyPayments(req.user.id);
  }

  // 💳 Create payment
  @Post()
  create(@Body() dto: CreatePaymentDto, @Req() req) {
    return this.paymentService.create(dto, req.user.id);
  }

  // ✅ Confirm payment (webhook / admin)
  @Patch(':id/confirm')
  confirm(
    @Param('id') paymentId: string,
    @Body('transactionId') transactionId: string,
  ) {
    return this.paymentService.confirm(paymentId, transactionId);
  }

  // ❌ Payment failed
  @Patch(':id/fail')
  fail(@Param('id') paymentId: string) {
    return this.paymentService.fail(paymentId);
  }

  // ❌ Delete payment (admin)
  @Delete(':id')
  async remove(@Param('id') paymentId: string) {
    return this.paymentService.remove(paymentId);
  }
}
