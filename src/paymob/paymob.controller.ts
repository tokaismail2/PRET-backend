import { Controller, Post, Get, Query, Body, Res } from '@nestjs/common';
import { PaymobService } from './paymob.service';
import { Response } from 'express';

@Controller('paymob')
export class PaymobController {
  constructor(private readonly paymobService: PaymobService) {}

  // Checkout route
  @Get('checkout')
  async checkout(@Query('amount') amount: string, @Res() res: Response) {
    const amountCents = Number(amount) * 100;
    const orderId = await this.paymobService.registerOrder(amountCents);
    const paymentKey = await this.paymobService.getPaymentKey(orderId, amountCents);
    const iframeUrl = this.paymobService.getIframeUrl(paymentKey);
    res.json({ iframeUrl });
  }

  // Webhook route
  @Post('webhook')
  async webhook(@Body() payload: any, @Res() res: Response) {
    if (!this.paymobService.verifyWebhook(payload)) {
      return res.status(400).send('Invalid webhook');
    }
    await this.paymobService.processPayment(payload);
    res.status(200).send('OK');
  }
}
