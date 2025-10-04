import React from 'react';
import QRCode from 'qrcode.react';
const LOCAL_LOGO_URL = new URL('../../assets/Logo_with_Color.png', import.meta.url).href;

/**
 * RECETRA Receipt Template Component
 * Displays receipts in a professional format similar to official acknowledgment receipts
 * 
 * @param {Object} receipt - The receipt data object
 * @param {string} organization - The organization name
 * @param {string} paymentMethod - The payment method ('Cash' or 'Online')
 * @param {boolean} inlineEmail - If true, render email-safe HTML (use <img> for QR)
 * @param {string} qrImageDataUrl - Optional data/remote URL for QR image when inlineEmail
 * @param {string} logoUrl - Optional absolute URL for the logo when sending via email
 */
const ReceiptTemplate = ({ receipt, organization, paymentMethod = 'Cash', inlineEmail = false, qrImageDataUrl, logoUrl }) => {
  // Convert amount to words (simplified version)
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

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: '2-digit' 
    });
  };

  // Get organization details
  const getOrganizationDetails = (orgName) => {
    const orgs = {
      'Computer Science Society': {
        name: 'Computer Science Society',
        subtitle: 'NU DASMA',
        code: 'CSS',
        fullName: 'Computer Science Society - NU Dasma'
      },
      'Student Council': {
        name: 'Student Council',
        subtitle: 'NU DASMA',
        code: 'SC',
        fullName: 'Student Council - NU Dasma'
      },
      'Engineering Society': {
        name: 'Engineering Society',
        subtitle: 'NU DASMA',
        code: 'ES',
        fullName: 'Engineering Society - NU Dasma'
      },
      'NU Dasma Admin': {
        name: 'NU Dasma Admin',
        subtitle: 'ADMINISTRATION',
        code: 'NU',
        fullName: 'NU Dasma Administration'
      }
    };
    return orgs[orgName] || {
      name: orgName || 'Organization',
      subtitle: 'NU DASMA',
      code: 'ORG',
      fullName: `${orgName || 'Organization'} - NU Dasma`
    };
  };

  const orgDetails = getOrganizationDetails(organization || receipt.organization);
  const amountInWords = convertAmountToWords(receipt.amount) + ' Pesos';

  // Email-safe spacing: reduce whitespace between logo and title for emails
  const headerStyle = inlineEmail ? { ...styles.header, marginTop: '-10px', marginBottom: '-100px', lineHeight: '0' } : styles.header;
  const logoStyle = inlineEmail ? { ...styles.logo, height: '170px', width: '170px', display: 'block', marginBottom: '0' } : styles.logo;
  const logoSectionStyle = inlineEmail ? { ...styles.logoSection, display: 'flex', justifyContent: 'center' } : styles.logoSection;
  // Pull the title upward but keep image visible in strict email clients
  const titleSectionStyle = styles.titleSection;

  return (
    <div style={styles.receiptContainer}>
      <div className="receipt" style={styles.receipt}>
        {/* Header with RECETRA Logo Only */}
        <div style={headerStyle}>
          {inlineEmail ? (
            <table role="presentation" width="100%" style={{ borderCollapse: 'collapse', margin: 0, padding: 0 }}>
              <tbody>
                <tr>
                  <td align="center" style={{ padding: 0 }}>
                    <img 
                      src={logoUrl || LOCAL_LOGO_URL}
                      alt="RECETRA Logo" 
                      style={{ ...logoStyle, display: 'block', margin: '0 auto' }}
                      onError={(e) => {
                        if (e.target.dataset.fallbackTried !== '1') {
                          e.target.dataset.fallbackTried = '1';
                          e.target.src = 'https://cdn.jsdelivr.net/gh/JOMPOGI/-RECETRA-/web/assets/Logo_with_Color.png';
                        } else {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div style={logoSectionStyle}>
              {/* Use absolute logo URL when provided (email-safe) */}
              <img 
                src={logoUrl || LOCAL_LOGO_URL}
                alt="RECETRA Logo" 
                style={logoStyle}
                onError={(e) => {
                  // Try jsDelivr CDN mirror of the repo asset, then fall back to text
                  if (e.target.dataset.fallbackTried !== '1') {
                    e.target.dataset.fallbackTried = '1';
                    e.target.src = 'https://cdn.jsdelivr.net/gh/JOMPOGI/-RECETRA-/web/assets/Logo_with_Color.png';
                  } else {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }
                }}
              />
              <div style={{...styles.logoPlaceholder, display: 'none'}}>
                <div style={styles.logoText}>RECETRA</div>
              </div>
            </div>
          )}
        </div>

        {/* Receipt Title */}
        <div style={titleSectionStyle}>
          <h2 style={styles.receiptTitle}>ACKNOWLEDGMENT RECEIPT</h2>
        </div>

        {/* Receipt Header */}
        <div style={styles.receiptHeader}>
          <div style={styles.receiptNumber}>
            <span style={styles.noLabel}>NO:</span>
            <span style={styles.receiptNumberValue}>{receipt.receiptNumber}</span>
          </div>
          <div style={styles.receiptDate}>
            <span style={styles.dateLabel}>Date:</span>
            <span style={styles.dateValue}>{formatDate(receipt.issuedAt)}</span>
          </div>
        </div>

        {/* Main Acknowledgment Text */}
        <div style={styles.acknowledgmentText}>
          <p style={styles.acknowledgmentParagraph}>
            This is to acknowledge that{' '}
            <span style={styles.underlinedSpace}>{orgDetails.fullName}</span>{' '}
            received from{' '}
            <span style={styles.underlinedName}>{receipt.payer}</span>{' '}
            the amount of{' '}
            <span style={styles.underlinedSpace}>{amountInWords}</span>{' '}
            <span style={styles.underlinedSpace}>(P {receipt.amount.toLocaleString()})</span>{' '}
            as payment for{' '}
            <span style={styles.underlinedSpace}>{receipt.purpose}</span>.
          </p>
        </div>

        {/* Payment Details */}
        <div style={styles.paymentDetailsSection}>
          <span style={styles.paymentDetailsLabel}>Payment Details: </span>
          <span style={styles.checkbox}>{paymentMethod === 'Cash' ? '☑' : '☐'}</span> Cash
          <span style={styles.checkbox}>{paymentMethod === 'Online' ? '☑' : '☐'}</span> Online
        </div>

        {/* Received By Section */}
        <div style={styles.receivedBySection}>
          <div style={styles.receivedByRow}>
            <span style={styles.receivedByLabel}>Received By:</span>
            <span style={styles.receivedByValue}>{receipt.issuedBy || 'System'}</span>
          </div>
        </div>

        {/* QR Code Section */}
        {(receipt.qrCode || qrImageDataUrl) && (
          <div style={styles.qrCodeSection}>
            <div style={styles.qrCodeContainer}>
              {inlineEmail ? (
                <img 
                  src={qrImageDataUrl || ''}
                  alt="Receipt QR"
                  width={120}
                  height={120}
                  style={{ display: 'block', margin: '0 auto' }}
                />
              ) : (
                <QRCode 
                  value={receipt.qrCode} 
                  size={120}
                  level="M"
                  includeMargin={true}
                />
              )}
            </div>
            <div style={styles.qrCodeNote}>
              Scan this QR code to verify receipt authenticity
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  receiptContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '0px',
    backgroundColor: '#ffffff',
    minHeight: 'auto'
  },
  receipt: {
    width: '100%',
    maxWidth: '600px',
    backgroundColor: 'white',
    padding: '20px 50px',
    borderRadius: '0px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif',
    lineHeight: '1.3',
    margin: '0'
  },
  header: {
    textAlign: 'center',
    marginBottom: '0px',
    marginTop: '-65px',
    borderBottom: 'none',
    paddingBottom: '0px',
    padding: '0px',
    height: 'auto'
  },
  logoSection: {
    marginBottom: '0px',
    padding: '0px',
    height: 'auto'
  },
  logo: {
    height: '280px',
    width: '280px',
    marginBottom: '0px',
    marginTop: '0px'
  },
  logoPlaceholder: {
    height: '280px',
    width: '280px',
    backgroundColor: '#4CAF50',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    marginTop: '0px'
  },
  logoText: {
    color: 'white',
    fontSize: '28px',
    fontWeight: 'bold',
    letterSpacing: '3px'
  },
  logoTextOnly: {
    color: '#4CAF50',
    fontSize: '28px',
    fontWeight: 'bold',
    letterSpacing: '3px',
    textAlign: 'center',
  },
  tagline: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    marginTop: '5px',
    fontStyle: 'italic'
  },
  titleSection: {
    textAlign: 'center',
    marginTop: '-120px',
    marginBottom: '30px'
  },
  receiptTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: '0',
    color: '#000',
    letterSpacing: '1px',
    textDecoration: 'underline'
  },
  receiptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '40px',
    alignItems: 'flex-start'
  },
  receiptNumber: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  receiptDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  noLabel: {
    fontSize: '16px',
    color: '#d32f2f',
    fontWeight: 'bold'
  },
  receiptNumberValue: {
    fontSize: '16px',
    color: '#000',
    fontWeight: 'bold',
    textDecoration: 'underline'
  },
  dateLabel: {
    fontSize: '16px',
    color: '#000',
    fontWeight: 'bold'
  },
  dateValue: {
    fontSize: '16px',
    color: '#000',
    fontWeight: 'bold',
    textDecoration: 'underline'
  },
  acknowledgmentText: {
    marginBottom: '40px',
    lineHeight: '1.2'
  },
  acknowledgmentParagraph: {
    fontSize: '16px',
    color: '#000',
    margin: '0',
    textAlign: 'left',
    lineHeight: '1.2'
  },
  underlinedSpace: {
    fontSize: '16px',
    color: '#000',
    fontWeight: 'bold',
    borderBottom: '1px solid #000',
    paddingBottom: '2px',
    display: 'inline-block',
    minWidth: '80px',
    textAlign: 'center'
  },
  underlinedName: {
    fontSize: '16px',
    color: '#000',
    fontWeight: 'bold',
    borderBottom: '1px solid #000',
    paddingBottom: '2px',
    display: 'inline-block',
    minWidth: '120px',
    textAlign: 'center'
  },
  paymentDetailsSection: {
    marginBottom: '40px'
  },
  paymentDetailsLabel: {
    fontSize: '15px',
    color: '#000',
    fontWeight: 'bold',
    marginBottom: '0px',
    marginTop: '0px',
    margin: '0px',
    lineHeight: '1',
    display: 'inline'
  },
  checkbox: {
    fontSize: '16px',
    color: '#000',
    fontWeight: 'bold',
    marginLeft: '20px'
  },
  receivedBySection: {
    marginTop: '40px',
    marginBottom: '20px'
  },
  receivedByRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  receivedByLabel: {
    fontSize: '16px',
    color: '#000',
    fontWeight: 'bold'
  },
  receivedByValue: {
    fontSize: '16px',
    color: '#000',
    fontWeight: 'bold',
    textDecoration: 'underline'
  },
  signatureLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  signatureLabel: {
    fontSize: '16px',
    color: '#000',
    fontWeight: 'bold'
  },
  signatureSpace: {
    flex: 1,
    height: '1px',
    borderBottom: '1px solid #000',
    marginTop: '10px'
  },

  // QR Code Section Styles
  qrCodeSection: {
    textAlign: 'center',
    display: 'block',
    marginTop: '30px',
    padding: '20px',
    border: '2px dashed #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9'
  },
  qrCodeContainer: {
    display: 'inline-block',
    margin: '0 auto',
    textAlign: 'center'
  },
  qrCodeNote: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
    display: 'block',
    marginTop: '10px',
    width: '100%'
  },
};

export default ReceiptTemplate;