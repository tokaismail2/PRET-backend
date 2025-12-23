import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PaymobService {
    private apiKey = process.env.PAYMOB_API_KEY;
    private integrationId = process.env.PAYMOB_INTEGRATION_ID;
    private iframeId = process.env.PAYMOB_IFRAME_ID;

    async getAuthToken(): Promise<string> {
        const res = await axios.post('https://accept.paymob.com/api/auth/tokens', {
            api_key: this.apiKey,
        });
        return res.data.token;
    }

    async registerOrder(amountCents: number): Promise<number> {
        const authToken = await this.getAuthToken();
        const res = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
            auth_token: authToken,
            delivery_needed: false,
            amount_cents: amountCents,
            currency: 'EGP',
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
                apartment: 'NA',
                email: 'test@test.com',
                floor: 'NA',
                first_name: 'Test',
                last_name: 'User',
                street: 'NA',
                building: 'NA',
                phone_number: '01000000000',
                shipping_method: 'NA',
                postal_code: 'NA',
                city: 'Cairo',
                country: 'EG',
                state: 'Cairo'
            }
        });
        return res.data.token;
    }

    getIframeUrl(paymentKey: string): string {
        return `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`;
    }

    verifyWebhook(payload: any): boolean {
        // لاحقًا ممكن تضيفي HMAC verification
        return true;
    }

    async processPayment(payload: any) {
        console.log('📥 Webhook payload:', payload);
        // هنا ممكن تحدثي قاعدة البيانات حسب order_id و status
    }

}