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
    const fullPayload = {
  service_id: this.serviceId,
  template_id: this.templateId,
  user_id: this.publicKey,
  template_params: {
    ...payload,
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