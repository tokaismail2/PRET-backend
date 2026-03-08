import { Controller, Post, Get, Query, Body, Res, HttpCode, Logger } from '@nestjs/common';
import { PaymobService } from './paymob.service';
import { Response } from 'express';

@Controller('paymob')
export class PaymobController {
  private readonly logger = new Logger(PaymobController.name);

  constructor(private readonly paymobService: PaymobService) {}


  @Post('webhook')
  @HttpCode(200)
  async webhook(@Body() payload: any, @Res() res: Response) {
    if (!this.paymobService.verifyWebhook(payload)) {
      console.warn('❌ Invalid webhook signature');
      return res.status(400).send('Invalid webhook');
    }

    await this.paymobService.processPayment(payload);
    return res.status(200).send('OK');
  }


  @Get('callback')
  async callback(@Query() query: any, @Res() res: Response) {
    console.log('📥 Paymob Callback received');
    console.log(`✅ Success          : ${query.success}`);
    console.log(`🔑 Merchant Order ID: ${query.merchant_order_id}`);
    console.log(`💰 Amount           : ${Number(query.amount_cents) / 100} EGP`);
    console.log(`💳 Card             : ${query['source_data.pan']} (${query['source_data.sub_type']})`);

    const isSuccess = query.success === 'true';
    const merchantOrderId = query.merchant_order_id;

    if (isSuccess && merchantOrderId) {
      await this.paymobService.handleCallback(merchantOrderId);
    }


    const frontendUrl = isSuccess
      ? `${process.env.FRONTEND_URL}/payment-success`
      : `${process.env.FRONTEND_URL}/payment-failed`;

    return res.redirect(frontendUrl);
  }
}