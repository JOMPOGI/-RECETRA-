import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { mockOrganizations, mockCategories, addReceipt } from '../data/mockData';
import { emailService } from '../services/emailService';
import ReceiptTemplate from '../components/ReceiptTemplate';

/**
 * Payment Gateway Screen Component
 * Allows viewers to make payments through PayMongo and receive digital receipts
 * 
 * Features:
 * - PayMongo payment processing
 * - Automatic receipt generation with QR codes
 * - Automatic email delivery to payer
 * - Receipt verification
 */
const PaymentGatewayScreen = () => {
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState({
    organization: '',
    category: '',
    amount: '',
    purpose: '',
    payerName: '',
    payerEmail: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  /**
   * Handles payment submission
   * Processes payment through PayMongo and generates receipt with QR code and email
   */
  const handlePaymentSubmit = async () => {
    if (!validatePaymentForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: REAL PAYMONGO INTEGRATION
      // 1. Create payment intent with PayMongo
      // const paymentIntent = await paymongo.createPaymentIntent({
      //   amount: parseFloat(paymentData.amount) * 100, // Convert to centavos
      //   currency: 'PHP',
      //   description: paymentData.purpose,
      //   // Add your PayMongo API key here
      //   apiKey: 'YOUR_PAYMONGO_SECRET_KEY'
      // });
      
      // 2. Redirect to PayMongo payment page or show payment form
      // 3. Handle payment success/failure callbacks
      // 4. Generate receipt only after successful payment

      // For now, simulate payment processing
      console.log('🔄 Simulating PayMongo payment processing...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate unique receipt number
      const receiptNumber = `OR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      // Generate QR code data with receipt details for verification
      const qrCodeData = JSON.stringify({
        receiptNumber,
        amount: parseFloat(paymentData.amount),
        payer: paymentData.payerName,
        organization: paymentData.organization,
        purpose: paymentData.purpose,
        timestamp: Date.now()
      });

      // Generate receipt with QR code
      const receipt = {
        id: `receipt_${Date.now()}`,
        receiptNumber,
        payer: paymentData.payerName,
        payerEmail: paymentData.payerEmail,
        amount: parseFloat(paymentData.amount),
        purpose: paymentData.purpose,
        category: paymentData.category,
        organization: paymentData.organization,
        issuedBy: user?.fullName || 'PayMongo Gateway',
        issuedAt: new Date().toISOString(),
        templateId: 'digital_payment',
        qrCode: qrCodeData,
        paymentStatus: 'completed',
        emailStatus: 'pending',
        isDigital: true,
      };

      // Add receipt to system
      addReceipt(receipt);

      // Send email to payer automatically
      if (paymentData.payerEmail) {
        try {
          const emailResult = await emailService.sendReceiptEmail(receipt, paymentData.payerEmail);
          
          if (emailResult.success) {
            console.log('📧 PayMongo receipt email sent successfully to:', paymentData.payerEmail);
            receipt.emailStatus = 'sent';
          } else {
            console.error('❌ Failed to send PayMongo receipt email:', emailResult.error);
            receipt.emailStatus = 'failed';
          }
        } catch (emailError) {
          console.error('❌ Email service error:', emailError);
          receipt.emailStatus = 'failed';
        }
      }

      setPaymentResult({
        success: true,
        receipt,
        message: 'Payment successful through PayMongo! Digital receipt has been generated and sent to your email.',
      });

      // Reset form
      setPaymentData({
        organization: '',
        category: '',
        amount: '',
        purpose: '',
        payerName: '',
        payerEmail: '',
      });

    } catch (error) {
      setPaymentResult({
        success: false,
        message: 'Payment failed. Please try again or contact support.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Validates payment form data
   * @returns {boolean} True if form is valid
   */
  const validatePaymentForm = () => {
    if (!paymentData.organization || !paymentData.category || !paymentData.amount || 
        !paymentData.purpose || !paymentData.payerName || !paymentData.payerEmail) {
      setPaymentResult({
        success: false,
        message: 'Please fill in all required fields',
        error: 'validation'
      });
      return false;
    }

    if (parseFloat(paymentData.amount) <= 0) {
      setPaymentResult({
        success: false,
        message: 'Please enter a valid amount',
        error: 'validation'
      });
      return false;
    }

    if (!paymentData.payerEmail.includes('@')) {
      setPaymentResult({
        success: false,
        message: 'Please enter a valid email address',
        error: 'validation'
      });
      return false;
    }

    return true;
  };

  /**
   * Handles input changes
   * @param {string} field - Field name to update
   * @param {string} value - New value for the field
   */
  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Component to display payment result
   * Shows receipt details after successful payment using ReceiptTemplate
   */
  const PaymentResult = () => (
    <div style={styles.resultContainer}>
      {paymentResult.success ? (
        <>
          <div style={styles.resultHeader}>
            <h3 style={styles.resultTitle}>Payment Successful!</h3>
            <div style={{...styles.statusBadge, backgroundColor: '#10b981'}}>
              <span style={styles.statusText}>Completed</span>
            </div>
          </div>
          
          <div style={styles.resultContent}>
            <p style={styles.successMessage}>{paymentResult.message}</p>
            
            {/* Receipt Template - Same as Encoder */}
            {paymentResult.receipt && (
              <div style={styles.receiptSection}>
                <h4 style={styles.receiptSectionTitle}>Digital Receipt</h4>
                <ReceiptTemplate 
                  receipt={paymentResult.receipt} 
                  organization={paymentResult.receipt.organization}
                />
              </div>
            )}

            {/* Email Status */}
            {paymentResult.receipt && (
              <div style={styles.emailStatusSection}>
                <h4 style={styles.emailStatusTitle}>Email Delivery Status</h4>
                <div style={styles.emailStatusRow}>
                  <span style={styles.emailStatusLabel}>Status:</span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: paymentResult.receipt.emailStatus === 'sent' ? '#10b981' : 
                      paymentResult.receipt.emailStatus === 'pending' ? '#f59e0b' : '#ef4444'
                  }}>
                    {paymentResult.receipt.emailStatus}
                  </span>
                </div>
                <p style={styles.emailStatusNote}>
                  Receipt has been sent to: {paymentResult.receipt.payerEmail}
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={styles.resultHeader}>
            <h3 style={{...styles.resultTitle, color: '#ef4444'}}>Validation Error</h3>
            <div style={{...styles.statusBadge, backgroundColor: '#ef4444'}}>
              <span style={styles.statusText}>Error</span>
            </div>
          </div>
          
          <div style={styles.resultContent}>
            <p style={{...styles.successMessage, color: '#ef4444'}}>{paymentResult.message}</p>
            
            <div style={styles.errorSection}>
              <h4 style={styles.errorTitle}>Please check the following:</h4>
              <ul style={styles.errorList}>
                <li style={styles.errorText}>Ensure all required fields are filled</li>
                <li style={styles.errorText}>Verify email format is correct</li>
                <li style={styles.errorText}>Check that amount is a valid number</li>
                <li style={styles.errorText}>Try again after fixing the issues</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Layout title="Payment Gateway" showBackButton={true}>
      <div className="innerContainer">
        <div style={styles.container}>
          <div style={styles.content}>
            {/* Header */}
            <div style={styles.header}>
              <h2 style={styles.title}>Payment Gateway</h2>
              <p style={styles.subtitle}>Make secure payments through PayMongo and receive digital receipts</p>
            </div>

            {/* Payment Form */}
            <div style={styles.form}>
              {/* Organization and Category */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Payment Details</h3>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Organization *</label>
                    <select
                      style={styles.select}
                      value={paymentData.organization}
                      onChange={(e) => handleInputChange('organization', e.target.value)}
                      required
                    >
                      <option value="">Select organization</option>
                      {mockOrganizations.map((org) => (
                        <option key={org.id} value={org.name}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Category *</label>
                    <select
                      style={styles.select}
                      value={paymentData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      required
                    >
                      <option value="">Select category</option>
                      {mockCategories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Amount (₱) *</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={paymentData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Purpose *</label>
                    <input
                      type="text"
                      style={styles.input}
                      value={paymentData.purpose}
                      onChange={(e) => handleInputChange('purpose', e.target.value)}
                      placeholder="e.g., Event Registration, Membership Fee"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payer Information */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Payer Information</h3>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name *</label>
                    <input
                      type="text"
                      style={styles.input}
                      value={paymentData.payerName}
                      onChange={(e) => handleInputChange('payerName', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email Address *</label>
                    <input
                      type="email"
                      style={styles.input}
                      value={paymentData.payerEmail}
                      onChange={(e) => handleInputChange('payerEmail', e.target.value)}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Payment Summary</h3>
                <div style={styles.summary}>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Organization:</span>
                    <span style={styles.summaryValue}>{paymentData.organization || 'Not selected'}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Category:</span>
                    <span style={styles.summaryValue}>{paymentData.category || 'Not selected'}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Amount:</span>
                    <span style={styles.summaryValue}>₱{paymentData.amount || '0.00'}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Purpose:</span>
                    <span style={styles.summaryValue}>{paymentData.purpose || 'Not specified'}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Email Delivery:</span>
                    <span style={styles.summaryValue}>Automatic to {paymentData.payerEmail || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div style={styles.buttonContainer}>
                <button
                  type="button"
                  style={isProcessing ? {...styles.submitButton, ...styles.submitButtonDisabled} : styles.submitButton}
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing Payment...' : 'Pay Now'}
                </button>
              </div>
            </div>

            {/* Payment Result */}
            {paymentResult && <PaymentResult />}
          </div>
        </div>
      </div>
    </Layout>
  );
};

/**
 * Styles for the PaymentGatewayScreen component
 */
const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  summary: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  summaryValue: {
    fontWeight: '500',
    color: '#374151',
    fontSize: 14,
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  resultContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    marginTop: 20,
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e3a8a',
    margin: 0,
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  statusText: {
    color: 'white',
  },
  resultContent: {
    textAlign: 'left',
  },
  successMessage: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
    lineHeight: 1.5,
  },
  receiptSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  receiptSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  receiptSummaryDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  qrCodeSection: {
    marginTop: 20,
  },
  qrCodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  qrCodeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  qrCodeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  qrCode: {
    width: '100%',
    height: 'auto',
  },
  qrCodeNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  receiptSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  receiptSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  emailStatusSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  emailStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  emailStatusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: 8,
  },
  emailStatusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  emailStatusNote: {
    fontSize: 14,
    color: '#6b7280',
    margin: 0,
  },
  errorSection: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    border: '1px solid #fecaca',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 12,
    margin: 0,
  },
  errorList: {
    margin: 0,
    paddingLeft: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 4,
  },

};

export default PaymentGatewayScreen;