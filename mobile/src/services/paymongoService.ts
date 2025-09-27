import { emailService } from './emailService';

class PayMongoService {
  private baseURL = 'https://api.paymongo.com/v1';
  private secretKey = process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY;
  private publicKey = process.env.EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY;

  constructor() {
    if (!this.secretKey || !this.publicKey) {
      console.warn('⚠️ PayMongo test keys missing. Set EXPO_PUBLIC_PAYMONGO_SECRET_KEY and EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY in your .env file.');
    }
    console.log('💳 PayMongo Service initialized in TEST MODE');
  }

  private async makeRequest(endpoint: string, data: any = null, method: string = 'GET'): Promise<any> {
    if (!this.secretKey) throw new Error('PayMongo secret key not configured');

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Basic ${btoa ? btoa(this.secretKey + ':') : Buffer.from(this.secretKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const options: RequestInit = { method, headers };
    if (data && method !== 'GET') options.body = JSON.stringify(data);

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      if (!response.ok) throw new Error(result.errors?.[0]?.detail || 'PayMongo API error');
      return result;
    } catch (error) {
      console.error('PayMongo API Error:', error);
      throw error;
    }
  }

  async createPaymentIntent(paymentData: any): Promise<{
    success: boolean;
    paymentIntent?: any;
    clientKey?: string;
    error?: string;
  }> {
    console.log('💳 Creating test payment intent', paymentData);

    const amountValue = parseFloat(String(paymentData.amount || '0'));
    const data = {
      data: {
        attributes: {
          amount: Math.round(isNaN(amountValue) ? 0 : amountValue * 100),
          currency: 'PHP',
          description: paymentData.purpose,
          payment_method_allowed: ['card'],
          metadata: {
            organization: paymentData.organization,
            category: paymentData.category,
            payer_name: paymentData.payerName,
            payer_email: paymentData.payerEmail
          }
        }
      }
    };

    try {
      const result = await this.makeRequest('/payment_intents', data, 'POST');
      return {
        success: true,
        paymentIntent: result.data,
        clientKey: result.data.attributes.client_key,
        error: undefined
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createPaymentMethod(paymentMethodData: any) { /* ... */ }
  async attachPaymentMethod(paymentIntentId: string, paymentMethodId: string) { /* ... */ }
  async confirmPaymentIntent(paymentIntentId: string) { /* ... */ }

  async processPayment(paymentData: any): Promise<{
    success: boolean;
    paymentIntent?: any;
    clientKey?: string;
    error?: string;
  }> {
    console.log('💳 Processing test payment', paymentData);
    const intentResult = await this.createPaymentIntent(paymentData);
    if (!intentResult.success) return intentResult;

    const rawAmount = paymentData.amount;
    const parsedAmount = typeof rawAmount === 'string' || typeof rawAmount === 'number'
      ? parseFloat(String(rawAmount))
      : 0;
    const safeAmount = `₱${(isNaN(parsedAmount) ? 0 : parsedAmount).toFixed(2)}`;

    const dateFormatted = new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const emailPayload = {
      customer_name: paymentData.payerName,
      amount_formatted: safeAmount,
      date_formatted: dateFormatted,
      receipt_html: `<p>Payment for ${paymentData.purpose} — ${paymentData.organization}</p>`
    };

    console.log('📤 EmailJS payload:', {
      ...emailPayload,
      to_email: paymentData.payerEmail
    });

   try {
  const response = await fetch("http://192.168.68.105:3000/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...emailPayload,
      to_email: paymentData.payerEmail
    })
  });

  const result = await response.json();
  if (result.success) {
    console.log("📧 Email sent successfully");
  } else {
    console.warn("⚠️ Email failed. Reason:", JSON.stringify(result.error, null, 2));
  }
} catch (emailError) {
  console.warn("⚠️ Email error:", emailError);
}

    return {
      success: true,
      paymentIntent: intentResult.paymentIntent,
      clientKey: intentResult.clientKey,
      error: undefined
    };
  }
}

const paymongoService = new PayMongoService();
export { paymongoService, PayMongoService };