class EmailService {
  private serviceId = 'service_8s0xtaf';
  private templateId = 'template_hqhwz3i';
  private publicKey = 'uy0m-dwW_CcXCzVah';

  async sendReceiptEmail(
    payload: {
      customer_name: string;
      amount_formatted: string;
      date_formatted: string;
      receipt_html: string;
    },
    payerEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    // Create comprehensive email content with introduction and receipt
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="margin-bottom: 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Dear ${payload.customer_name},</p>
          <p style="font-size: 16px; color: #333; margin-bottom: 10px;">
            We're pleased to inform you that your payment of ${payload.amount_formatted} on ${payload.date_formatted} has been successfully processed.
          </p>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Thank you for your prompt payment. If you have any questions or concerns please contact us.
          </p>
        </div>
        
        <div style="border-top: 2px solid #eee; padding-top: 20px;">
          ${payload.receipt_html}
        </div>
      </div>
    `;

    const fullPayload = {
      service_id: this.serviceId,
      template_id: this.templateId,
      user_id: this.publicKey,
      template_params: {
        ...payload,
        receipt_html: emailContent,
        to_email: payerEmail,
        from_name: 'RECETRA'
      }
    };

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload)
      });

      if (response.ok) {
        console.log('📧 EmailJS sent to', payerEmail);
        return { success: true };
      } else {
        const errorText = await response.text();
        console.warn('⚠️ EmailJS failed:', errorText);
        return { success: false, error: errorText };
      }
    } catch (err: any) {
      console.error('⚠️ EmailJS error:', err.message);
      return { success: false, error: err.message };
    }
  }
}

export const emailService = new EmailService();
export { EmailService };