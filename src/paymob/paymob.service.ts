import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import * as crypto from 'crypto';
import { Payment } from '../models/payment.schema';

@Injectable()
export class PaymobService {
  private readonly logger = new Logger(PaymobService.name);

  private apiKey = process.env.PAYMOB_API_KEY;
  private integrationId = process.env.PAYMOB_INTEGRATION_ID;
  private iframeId = process.env.PAYMOB_IFRAME_ID;
  private hmacSecret = process.env.PAYMOB_HMAC_SECRET;

  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<any>,
  ) {}

  async getAuthToken(): Promise<string> {
    const res = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: this.apiKey,
    });
    return res.data.token;
  }

  async registerOrder(amountCents: number, merchantOrderId: string): Promise<number> {
    const authToken = await this.getAuthToken();
    const res = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: 'EGP',
      merchant_order_id: merchantOrderId,
      items: [],
    });
    return res.data.id;
  }

  async getPaymentKey(orderId: number, amountCents: number): Promise<string> {
    const authToken = await this.getAuthToken();
    const res = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      currency: 'EGP',
      integration_id: this.integrationId,
      billing_data: {
        apartment: 'NA', email: 'NA', floor: 'NA',
        first_name: 'NA', last_name: 'NA', street: 'NA',
        building: 'NA', phone_number: 'NA', shipping_method: 'NA',
        postal_code: 'NA', city: 'Cairo', country: 'EG', state: 'Cairo',
      },
    });
    return res.data.token;
  }

  getIframeUrl(paymentKey: string): string {
    return `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`;
  }

  verifyWebhook(payload: any): boolean {
    if (!this.hmacSecret) return true;

    const obj = payload?.obj;
    if (!obj) return false;

    const hmacString = [
      obj.amount_cents, obj.created_at, obj.currency, obj.error_occured,
      obj.has_parent_transaction, obj.id, obj.integration_id, obj.is_3d_secure,
      obj.is_auth, obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
      obj.is_voided, obj.order?.id, obj.owner, obj.pending,
      obj.source_data?.pan, obj.source_data?.sub_type, obj.source_data?.type, obj.success,
    ].join('');

    const hash = crypto
      .createHmac('sha512', this.hmacSecret)
      .update(hmacString)
      .digest('hex');

    return hash === payload.hmac;
  }

  extractMerchantOrderId(payload: any): string | null {
    return payload?.obj?.order?.merchant_order_id ?? null;
  }

  isPaymentSuccessful(payload: any): boolean {
    return payload?.obj?.success === true;
  }

  async processPayment(payload: any): Promise<void> {
    const obj = payload?.obj;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Paymob Webhook Received');
    console.log(`Transaction ID   : ${obj?.id}`);
    console.log(`Paymob Order ID  : ${obj?.order?.id}`);
    console.log(`Merchant Order ID: ${obj?.order?.merchant_order_id}`);
    console.log(`Amount           : ${obj?.amount_cents / 100} EGP`);
    console.log(`Success          : ${obj?.success}`);
    console.log(`Pending          : ${obj?.pending}`);
    console.log(`Error Occurred   : ${obj?.error_occured}`);
    console.log(`Card             : ${obj?.source_data?.pan} (${obj?.source_data?.sub_type})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const merchantOrderId = this.extractMerchantOrderId(payload);
    const isSuccess = this.isPaymentSuccessful(payload);

    if (isSuccess && merchantOrderId) {
      await this.paymentModel.findByIdAndUpdate(merchantOrderId, {
        status: 'completed',
      });
      console.log(`Payment ${merchantOrderId} marked as completed`);
    } else {
      console.warn(`Payment not successful | merchantOrderId: ${merchantOrderId}`);
    }
  }
  
  async handleCallback(merchantOrderId: string): Promise<void> {
    await this.paymentModel.findByIdAndUpdate({paymob_order_id : merchantOrderId}, {
      status: 'completed',
    });
    console.log(`Callback: Payment ${merchantOrderId} marked as completed`);
  }
}



