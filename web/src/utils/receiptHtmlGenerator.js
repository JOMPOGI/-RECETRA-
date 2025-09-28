/**
 * Receipt HTML Generator
 * Generates comprehensive HTML for email receipts matching the mobile app design
 */

export const generateReceiptHtml = (receipt) => {
  // Convert amount to words
  const convertAmountToWords = (amount) => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: '2-digit' 
    });
  };

  const getOrganizationDetails = (orgName) => {
    const orgs = {
      'Computer Science Society': { fullName: 'Computer Science Society - NU Dasma' },
      'Student Council': { fullName: 'Student Council - NU Dasma' },
      'Engineering Society': { fullName: 'Engineering Society - NU Dasma' },
      'NU Dasma Admin': { fullName: 'NU Dasma Administration' }
    };
    return orgs[orgName] || { fullName: `${orgName || 'Organization'} - NU Dasma` };
  };

  const orgDetails = getOrganizationDetails(receipt.organization);
  const amountInWords = convertAmountToWords(receipt.amount) + ' Pesos';
  const paymentMethod = receipt.paymentMethod === 'Paymongo' || receipt.paymentMethod === 'Online' ? 'Online' : 'Cash';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Receipt - ${receipt.receiptNumber}</title>
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
        <div class="logo">RECETRA</div>
      </div>

      <!-- Receipt Title -->
      <div class="receipt-title">ACKNOWLEDGMENT RECEIPT</div>

      <!-- Receipt Header -->
      <div class="receipt-header">
        <div class="receipt-number">
          NO: <span class="receipt-number-value">${receipt.receiptNumber}</span>
        </div>
        <div class="receipt-date">
          Date: <span class="receipt-date-value">${formatDate(receipt.issuedAt)}</span>
        </div>
      </div>

      <!-- Main Acknowledgment Text -->
      <div class="acknowledgment-text">
        <p>
          This is to acknowledge that <span class="underlined">${orgDetails.fullName}</span> received from <span class="underlined">${receipt.payer}</span> the amount of <span class="underlined">${amountInWords}</span> <span class="underlined">(P ${receipt.amount.toLocaleString()})</span> as payment for <span class="underlined">${receipt.purpose}</span>.
        </p>
      </div>

      <!-- Payment Details -->
      <div class="payment-details">
        <div class="payment-details-label">Payment Details:</div>
        <div class="payment-options">
          <span class="checkbox">${paymentMethod === 'Cash' ? '☑' : '☐'} Cash</span>
          <span class="checkbox">${paymentMethod === 'Online' ? '☑' : '☐'} Online</span>
        </div>
      </div>

      <!-- Received By Section -->
      <div class="received-by">
        <span class="received-by-label">Received By:</span>
        <span class="received-by-value">${receipt.issuedBy || 'System'}</span>
      </div>

      <!-- QR Code Section -->
      ${receipt.qrCode ? `
      <div class="qr-section">
        <div class="qr-container">
          <div style="display: inline-block; width: 120px; height: 120px; background-color: #f0f0f0; border: 2px solid #ccc; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">
            QR Code<br/>${receipt.receiptNumber}
          </div>
        </div>
        <div class="qr-note">Scan this QR code to verify receipt authenticity</div>
      </div>
      ` : ''}
    </div>
  </body>
  </html>
  `;
};
