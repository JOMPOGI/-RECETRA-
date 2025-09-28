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

    // Generate comprehensive receipt HTML
    const generateReceiptHtml = (receiptData: any): string => {
      // Convert amount to words
      const convertAmountToWords = (amount: number): string => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        
        if (amount === 0) return 'Zero';
        if (amount < 10) return ones[amount];
        if (amount < 20) return teens[amount - 10];
        if (amount < 100) return tens[Math.floor(amount / 10)] + (amount % 10 ? '-' + ones[amount % 10] : '');
        if (amount < 1000) {
          const hundreds = Math.floor(amount / 100);
          const remainder = amount % 100;
          return ones[hundreds] + ' Hundred' + (remainder ? ' ' + convertAmountToWords(remainder) : '');
        }
        if (amount < 1000000) {
          const thousands = Math.floor(amount / 1000);
          const remainder = amount % 1000;
          return convertAmountToWords(thousands) + ' Thousand' + (remainder ? ' ' + convertAmountToWords(remainder) : '');
        }
        return 'Amount too large';
      };

      const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
          month: 'numeric', 
          day: 'numeric', 
          year: '2-digit' 
        });
      };

      const getOrganizationDetails = (orgName: string) => {
        const orgs: { [key: string]: { fullName: string } } = {
          'Computer Science Society': { fullName: 'Computer Science Society - NU Dasma' },
          'Student Council': { fullName: 'Student Council - NU Dasma' },
          'Engineering Society': { fullName: 'Engineering Society - NU Dasma' },
          'NU Dasma Admin': { fullName: 'NU Dasma Administration' }
        };
        return orgs[orgName] || { fullName: `${orgName || 'Organization'} - NU Dasma` };
      };

      const orgDetails = getOrganizationDetails(receiptData.organization);
      const amountInWords = convertAmountToWords(receiptData.amount) + ' Pesos';
      const paymentMethod = 'Online'; // PayMongo payments are always online

      return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Digital Receipt - ${receiptData.receiptNumber || 'OR-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 9999).toString().padStart(4, '0')}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            line-height: 1.4;
          }
          .receipt-container {
            max-width: 500px;
            margin: 0 auto;
            background-color: white;
            border: 2px dashed #ccc;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .logo {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 16px;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          .receipt-title {
            font-size: 20px;
            font-weight: bold;
            color: #000;
            text-align: center;
            text-decoration: underline;
            margin: 10px 0 15px 0;
          }
          .receipt-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            align-items: center;
          }
          .receipt-number {
            color: #d32f2f;
            font-weight: bold;
            font-size: 16px;
          }
          .receipt-number-value {
            color: #000;
            font-weight: bold;
            text-decoration: underline;
          }
          .receipt-date {
            color: #000;
            font-weight: bold;
            font-size: 16px;
          }
          .receipt-date-value {
            color: #000;
            font-weight: bold;
            text-decoration: underline;
          }
          .acknowledgment-text {
            margin: 15px 0;
            font-size: 16px;
            line-height: 1.5;
          }
          .underlined {
            font-weight: bold;
            text-decoration: underline;
            color: #000;
          }
          .payment-details {
            margin: 15px 0;
          }
          .payment-details-label {
            font-size: 15px;
            color: #000;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .payment-options {
            display: flex;
            gap: 20px;
          }
          .checkbox {
            font-size: 16px;
            color: #000;
            font-weight: bold;
          }
          .received-by {
            margin: 15px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .received-by-label {
            font-size: 16px;
            color: #000;
            font-weight: bold;
          }
          .received-by-value {
            font-size: 16px;
            color: #000;
            font-weight: bold;
            text-decoration: underline;
          }
          .qr-section {
            text-align: center;
            margin-top: 20px;
            padding: 15px;
            border: 2px dashed #ccc;
            border-radius: 8px;
            background-color: #f9f9f9;
          }
          .qr-container {
            margin-bottom: 8px;
          }
          .qr-note {
            font-size: 12px;
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Header with Logo -->
          <div class="header">
            <img src="data:image/png;base64,${receiptData.logoBase64 || ''}" alt="RECETRA Logo" style="height: 50px; width: auto; margin-bottom: 15px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
            <div class="logo" style="display: none; background-color: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 16px; letter-spacing: 1px; margin-bottom: 10px;">RECETRA</div>
          </div>

          <!-- Receipt Title -->
          <div class="receipt-title">ACKNOWLEDGMENT RECEIPT</div>

          <!-- Receipt Header -->
          <div class="receipt-header">
            <div class="receipt-number">
              NO: <span class="receipt-number-value">${receiptData.receiptNumber || 'OR-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 9999).toString().padStart(4, '0')}</span>
            </div>
            <div class="receipt-date">
              Date: <span class="receipt-date-value">${formatDate(new Date().toISOString())}</span>
            </div>
          </div>

          <!-- Main Acknowledgment Text -->
          <div class="acknowledgment-text">
            <p>
              This is to acknowledge that <span class="underlined">${orgDetails.fullName}</span> received from <span class="underlined">${receiptData.payerName}</span> the amount of <span class="underlined">${amountInWords}</span> <span class="underlined">(P ${receiptData.amount.toLocaleString()})</span> as payment for <span class="underlined">${receiptData.purpose}</span>.
            </p>
          </div>

          <!-- Payment Details -->
          <div class="payment-details">
            <div class="payment-details-label">Payment Details:</div>
            <div class="payment-options">
              <span class="checkbox">☐ Cash</span>
              <span class="checkbox">☑ Online</span>
            </div>
          </div>

          <!-- Received By Section -->
          <div class="received-by">
            <span class="received-by-label">Received By:</span>
            <span class="received-by-value">System</span>
          </div>

          <!-- QR Code Section -->
          <div class="qr-section">
            <div class="qr-container">
              <div style="display: inline-block; width: 120px; height: 120px; background-color: #f0f0f0; border: 2px solid #ccc; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">
                QR Code<br/>${receiptData.receiptNumber || 'OR-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 9999).toString().padStart(4, '0')}
              </div>
            </div>
            <div class="qr-note">Scan this QR code to verify receipt authenticity</div>
          </div>
        </div>
      </body>
      </html>
      `;
    };

    const emailPayload = {
      customer_name: paymentData.payerName,
      amount_formatted: safeAmount,
      date_formatted: dateFormatted,
      receipt_html: generateReceiptHtml({
        receiptNumber: 'OR-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
        payerName: paymentData.payerName,
        amount: parsedAmount,
        purpose: paymentData.purpose,
        organization: paymentData.organization
      })
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