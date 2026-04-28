import { Controller, Post, Get, Query, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { PaymobService } from './paymob.service';

@Controller('paymob')
export class PaymobController {

  constructor(private readonly paymobService: PaymobService) {}

  // Webhook POST (server-to-server)
  @Post('webhook')
  async webhook(@Body() payload: any) {
    if (!this.paymobService.verifyWebhook(payload)) return { status: 'invalid' };
    await this.paymobService.processPayment(payload);
    return { status: 'ok' };
  }

  // Callback GET (browser redirect after payment)
  @Get('webhook')
  async callback(
    @Query('success') success: string,
    @Query('merchant_order_id') merchantOrderId: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL;

    if (success === 'true' && merchantOrderId) {
      await this.paymobService.handleCallback(merchantOrderId);
      return res.redirect(`${frontendUrl}/?payment=success`);
    }

    return res.redirect(`${frontendUrl}/?payment=failed`);
  }
}