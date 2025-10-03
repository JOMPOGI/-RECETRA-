import React, { useState, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import Layout from '../components/Layout';
import ReceiptTemplate from '../components/ReceiptTemplate';
import { useAuth } from '../context/AuthContext';
import { useInlineNotification } from '../components/InlineNotificationSystem';
import { mockCategories, mockReceiptTemplates, addReceipt } from '../data/mockData';
import { emailService } from '../services/emailService';
import QRCode from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import qrcode from 'qrcode';

/**
 * Issue Receipt Screen Component
 * Allows encoders to manually issue receipts for cash transactions
 * 
 * Features:
 * - Manual receipt issuance for cash payments
 * - Optional category and purpose fields
 * - Template selection
 * - Automatic QR code generation
 * - Automatic email notifications to payer
 * - Receipt customization
 */
const IssueReceiptScreen = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useInlineNotification();
  const [receiptData, setReceiptData] = useState({
    payer: '',
    payerEmail: '', // Added email field
    amount: '',
    organization: user?.organization || '',
    purpose: '',
    category: '',
    template: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);
  const [errorModal, setErrorModal] = useState(false);
  const receiptRef = useRef(null);

  // Organization mapping for auto-fill
  const organizationMapping = {
    'Computer Science Society': {
      purpose: 'Computer Science Society Activities',
      category: 'Student Organization',
      template: '1' // Student Organization Receipt
    },
    'Student Council': {
      purpose: 'Student Council Activities',
      category: 'Student Government',
      template: '2' // Student Government Receipt
    },
    'Engineering Society': {
      purpose: 'Engineering Society Activities',
      category: 'Student Organization',
      template: '1' // Student Organization Receipt
    },
    'NU Dasma Admin': {
      purpose: 'Administrative Services',
      category: 'Administration',
      template: '3' // Administrative Receipt
    }
  };

  // Category mapping for auto-fill
  const categoryMapping = {
    'Student Organization': {
      purpose: 'Student Organization Activities',
      template: '1' // Student Organization Receipt
    },
    'Student Government': {
      purpose: 'Student Government Activities',
      template: '2' // Student Government Receipt
    },
    'Administration': {
      purpose: 'Administrative Services',
      template: '3' // Administrative Receipt
    },
    'Event Registration': {
      purpose: 'Event Registration Fee',
      template: '4' // Event Registration Receipt
    },
    'Membership': {
      purpose: 'Membership Fee',
      template: '5' // Membership Fee Receipt
    }
  };

  // Purpose mapping for auto-fill
  const purposeMapping = {
    'Event Registration': {
      category: 'Event Registration',
      template: '4' // Event Registration Receipt
    },
    'Membership Fee': {
      category: 'Membership',
      template: '5' // Membership Fee Receipt
    },
    'Activity Fee': {
      category: 'Student Organization',
      template: '1' // Student Organization Receipt
    },
    'Administrative Services': {
      category: 'Administration',
      template: '3' // Administrative Receipt
    },
    'Computer Science Society Activities': {
      category: 'Student Organization',
      template: '1' // Student Organization Receipt
    },
    'Student Council Activities': {
      category: 'Student Government',
      template: '2' // Student Government Receipt
    },
    'Engineering Society Activities': {
      category: 'Student Organization',
      template: '1' // Student Organization Receipt
    }
  };

  // Template mapping for auto-fill
  const templateMapping = {
    '1': {
      category: 'Student Organization',
      purpose: 'Student Organization Activities'
    },
    '2': {
      category: 'Student Government',
      purpose: 'Student Government Activities'
    },
    '3': {
      category: 'Administration',
      purpose: 'Administrative Services'
    },
    '4': {
      category: 'Event Registration',
      purpose: 'Event Registration Fee'
    },
    '5': {
      category: 'Membership',
      purpose: 'Membership Fee'
    }
  };

  // Available organizations for dropdown
  const availableOrganizations = [
    'Computer Science Society',
    'Student Council', 
    'Engineering Society',
    'NU Dasma Admin'
  ];

  // Available purposes for dropdown
  const availablePurposes = [
    'Event Registration',
    'Membership Fee',
    'Activity Fee',
    'Administrative Services',
    'Computer Science Society Activities',
    'Student Council Activities',
    'Engineering Society Activities',
    'Other'
  ];

  /**
   * Handles organization change and auto-fills related fields
   */
  const handleOrganizationChange = (organization) => {
    const mapping = organizationMapping[organization] || {};
    setReceiptData(prev => ({
      ...prev,
      organization,
      purpose: mapping.purpose || prev.purpose,
      category: mapping.category || prev.category,
      template: mapping.template || prev.template
    }));
  };

  /**
   * Handles category change and auto-fills related fields
   */
  const handleCategoryChange = (category) => {
    const mapping = categoryMapping[category] || {};
    setReceiptData(prev => ({
      ...prev,
      category,
      purpose: mapping.purpose || prev.purpose,
      template: mapping.template || prev.template
    }));
  };

  /**
   * Handles purpose change and auto-fills related fields
   */
  const handlePurposeChange = (purpose) => {
    const mapping = purposeMapping[purpose] || {};
    setReceiptData(prev => ({
      ...prev,
      purpose,
      category: mapping.category || prev.category,
      template: mapping.template || prev.template
    }));
  };

  /**
   * Handles template change and auto-fills related fields
   */
  const handleTemplateChange = (template) => {
    const mapping = templateMapping[template] || {};
    setReceiptData(prev => ({
      ...prev,
      template,
      category: mapping.category || prev.category,
      purpose: mapping.purpose || prev.purpose
    }));
  };

  /**
   * Handles receipt submission
   * Validates input and creates new receipt with QR code and email
   */
  const handleSubmit = async () => {
    if (!receiptData.payer.trim() || !receiptData.amount.trim()) {
      setErrorModal(true);
      return;
    }

    if (!receiptData.payerEmail.trim()) {
      showError('Payer email is required for receipt delivery', 'Validation Error');
      return;
    }

    const amount = parseFloat(receiptData.amount);
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid amount', 'Validation Error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate unique receipt number
      const receiptNumber = `OR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
             // Generate QR code data with receipt details for verification
       const qrCodeData = JSON.stringify({
         receiptNumber,
         amount,
         payer: receiptData.payer,
         organization: user?.organization || '',
         purpose: receiptData.purpose || 'Cash Payment',
         timestamp: Date.now()
       });
      
      // Create receipt data with QR code
      const receipt = {
        id: `receipt_${Date.now()}`,
        receiptNumber,
        payer: receiptData.payer,
        payerEmail: receiptData.payerEmail,
        amount,
        purpose: receiptData.purpose || 'Cash Payment',
        category: receiptData.category || 'Manual Receipt',
        organization: user?.organization || '',
        issuedBy: user?.fullName || '',
        issuedAt: new Date().toISOString(),
        paymentStatus: 'completed',
        emailStatus: 'pending',
        templateId: receiptData.template || '1',
        qrCode: qrCodeData, // Store QR code data
        paymentMethod: 'Cash',
      };

      // Add receipt to mock data
      const newReceipt = addReceipt(receipt);

      // Send email to payer automatically
      if (receiptData.payerEmail) {
        try {
          // Generate QR code as data URL for email
          const qrImageDataUrl = await qrcode.toDataURL(receipt.qrCode, { 
            errorCorrectionLevel: 'H',
            width: 120,
            margin: 1
          });

          // Generate receipt HTML for email
          const receiptHtml = ReactDOMServer.renderToStaticMarkup(
            <ReceiptTemplate 
              receipt={receipt} 
              organization={user?.organization || receipt.organization}
              paymentMethod="Cash"
              inlineEmail={true}
              qrImageDataUrl={qrImageDataUrl}
              logoUrl="https://raw.githubusercontent.com/JOMPOGI/-RECETRA-/main/web/assets/Logo_with_Color.png"
            />
          );

          // Debug: Log the generated HTML to see if logoUrl is being used
          console.log('Generated receipt HTML includes logoUrl:', receiptHtml.includes('via.placeholder.com'));

          const emailResult = await emailService.sendReceiptEmail(
            {
              html: receiptHtml,
              amount_formatted: `₱${amount.toLocaleString()}`,
              date_formatted: new Date(receipt.issuedAt).toLocaleString(),
              customerName: receipt.payer
            },
            receiptData.payerEmail,
            {
              subject: `Receipt ${receiptNumber}`,
              supportContact: 'support@yourdomain.com',
              customerName: receipt.payer
            }
          );
          
          if (emailResult.success) {
            console.log('📧 Receipt email sent successfully to:', receiptData.payerEmail);
            receipt.emailStatus = 'sent';
          } else {
            console.error('❌ Failed to send receipt email:', emailResult.error);
            receipt.emailStatus = 'failed';
          }
        } catch (emailError) {
          console.error('❌ Email service error:', emailError);
          receipt.emailStatus = 'failed';
        }
      }

      // Set generated receipt for display
      setGeneratedReceipt(receipt);

      // Show success message
      showSuccess(
        `Receipt ${receiptNumber} has been created successfully!\n\nQR Code generated and email sent to ${receiptData.payerEmail}.\n\nThe payer will receive their receipt via email.`,
        'Receipt Issued Successfully!'
      );

      // Reset form
      setReceiptData({
        payer: '',
        payerEmail: '',
        amount: '',
        purpose: '',
        category: '',
        template: '',
      });
    } catch (error) {
      console.error('Error creating receipt:', error);
      showError('Failed to create receipt. Please try again.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles input changes
   * @param {string} field - Field name to update
   * @param {string} value - New value for the field
   */
  const handleInputChange = (field, value) => {
    setReceiptData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handles form reset
   */
  const handleReset = () => {
    setReceiptData({
      payer: '',
      payerEmail: '',
      amount: '',
      purpose: '',
      category: '',
      template: '',
    });
    setGeneratedReceipt(null);
  };

  /**
   * Handles receipt download as image
   */
  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) {
      showError('No receipt to download', 'Download Error');
      return;
    }

    try {
      console.log('Starting download...');
      
      const dataUrl = await htmlToImage.toPng(receiptRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        includeQueryParams: true,
        skipFonts: false,
        style: {
          backgroundColor: '#ffffff',
          margin: '0',
          padding: '0'
        }
      });
      
      console.log('Image generated, creating download link...');
      const link = document.createElement('a');
      link.download = `receipt-${generatedReceipt.receiptNumber}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Download completed');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      showError('Error downloading receipt: ' + error.message, 'Download Error');
    }
  };

  return (
    <Layout title="Issue Receipt" showBackButton={true}>
      <div className="innerContainer">
        <div style={styles.container}>
          <div style={styles.content}>
          {/* Header */}
          <div style={styles.header}>
            <h2 style={styles.title}>Issue New Receipt</h2>
            <p style={styles.subtitle}>Create a receipt for cash payments with automatic email delivery</p>
          </div>

          {/* Receipt Form */}
          <div style={styles.form}>
            {/* Payer Information */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Payer Information</h3>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payer Name *</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={receiptData.payer}
                    onChange={(e) => handleInputChange('payer', e.target.value)}
                    placeholder="Enter payer's full name"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payer Email *</label>
                  <input
                    type="email"
                    style={styles.input}
                    value={receiptData.payerEmail}
                    onChange={(e) => handleInputChange('payerEmail', e.target.value)}
                    placeholder="Enter payer's email address"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Organization Selection */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Organization Details</h3>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Organization *</label>
                  <select
                    style={styles.select}
                    value={receiptData.organization}
                    onChange={(e) => handleOrganizationChange(e.target.value)}
                    required
                  >
                    <option value="">Select organization</option>
                    {availableOrganizations.map((org) => (
                      <option key={org} value={org}>
                        {org}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Payment Details</h3>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Amount (₱) *</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={receiptData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Purpose</label>
                  <select
                    style={styles.select}
                    value={receiptData.purpose}
                    onChange={(e) => handlePurposeChange(e.target.value)}
                  >
                    <option value="">Select purpose</option>
                    {availablePurposes.map((purpose) => (
                      <option key={purpose} value={purpose}>
                        {purpose}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select
                    style={styles.select}
                    value={receiptData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {mockCategories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Template</label>
                  <select
                    style={styles.select}
                    value={receiptData.template}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                  >
                    <option value="">Select template</option>
                    {mockReceiptTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Receipt Summary</h3>
              <div style={styles.summary}>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Organization:</span>
                  <span style={styles.summaryValue}>{receiptData.organization || 'Not selected'}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Issued By:</span>
                  <span style={styles.summaryValue}>{user?.fullName}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Date:</span>
                  <span style={styles.summaryValue}>{new Date().toLocaleDateString()}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Status:</span>
                  <span style={styles.summaryValue}>Cash Payment</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Email Delivery:</span>
                  <span style={styles.summaryValue}>{receiptData.payerEmail || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={styles.buttonContainer}>
              <button
                type="button"
                style={styles.resetButton}
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Reset Form
              </button>
              <button
                type="button"
                style={isSubmitting ? {...styles.submitButton, ...styles.submitButtonDisabled} : styles.submitButton}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Issuing Receipt...' : 'Issue Receipt'}
              </button>
            </div>
          </div>

          {/* Generated Receipt Display */}
          {generatedReceipt && (
            <div style={styles.receiptDisplay}>
              <div style={styles.receiptHeader}>
                <h3 style={styles.receiptTitle}>Generated Receipt</h3>
                <button
                  style={styles.downloadButton}
                  onClick={handleDownloadReceipt}
                >
                   Download Receipt
                </button>
              </div>
              <div ref={receiptRef} style={{ 
                backgroundColor: 'white', 
                padding: '0', 
                margin: '0'
              }}>
                <ReceiptTemplate 
                  receipt={generatedReceipt} 
                  organization={user?.organization} 
                />
              </div>
            </div>
          )}

          {/* Error Modal for missing payer name and amount */}
            {errorModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.2)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  background: 'white', borderRadius: 12, padding: '28px 24px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)', minWidth: 320, maxWidth: '90vw', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a8a', marginBottom: 12 }}>Missing Required Fields</div>
                  <div style={{ fontSize: 15, color: '#000000ff', marginBottom: 18 }}>Payer name and amount are required.</div>
                  <button style={{ backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer', minWidth: 90 }} onClick={() => setErrorModal(false)}>
                    OK
                  </button>
                </div>
              </div>
            )}

          {/* Instructions */}
          <div style={styles.instructionsContainer}>
            <h3 style={styles.instructionsTitle}>Instructions</h3>
            <div style={styles.instructions}>
                         <div style={styles.instructionItem}>
             <h4 style={styles.instructionTitle}>Automatic Email Delivery</h4>
             <p style={styles.instructionText}>
               Every receipt is automatically emailed to the payer with a copy of the receipt and verification QR code.
             </p>
           </div>
           <div style={styles.instructionItem}>
             <h4 style={styles.instructionTitle}>QR Code Verification</h4>
             <p style={styles.instructionText}>
               Each receipt includes a unique QR code that can be scanned to verify authenticity using our mobile app or web verification system.
             </p>
           </div>
           <div style={styles.instructionItem}>
             <h4 style={styles.instructionTitle}>Cash Payment Processing</h4>
             <p style={styles.instructionText}>
               This form is for cash payments. For online payments, use the Payment Gateway screen.
             </p>
           </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

/**
 * Styles for the IssueReceiptScreen component
 */
const styles = {
  container: {
    backgroundColor: '#f5f5f5',
    minHeight: '100%',
  },
  
  content: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '8px',
    margin: '0 0 8px 0',
  },
  
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  
  form: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  
  section: {
    marginBottom: '32px',
  },
  
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
    margin: '0 0 16px 0',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '8px',
  },
  
  formRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  
  formGroup: {
    flex: 1,
  },
  
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    display: 'block',
  },
  
  input: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  
  select: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  
  summary: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
  },
  
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  
  summaryLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  
  summaryValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  
  resetButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  submitButton: {
    backgroundColor: '#1e3a8a',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  
  receiptDisplay: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginTop: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  
  receiptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '12px',
  },
  
  receiptTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#374151',
    margin: '0',
  },
  
  downloadButton: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  
  receiptContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  
  receiptInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
  },
  
  receiptInfoItem: {
    marginBottom: '8px',
  },
  
  receiptInfoLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginRight: '8px',
  },
  
  receiptInfoValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  
  qrCodeSection: {
    textAlign: 'center',
  },
  
  qrCodeTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  
  qrCodeDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  
  qrCodeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px',
  },
  
  qrCode: {
    marginBottom: '10px',
  },
  
  qrCodeNote: {
    fontSize: '12px',
    color: '#6b7280',
  },
  
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
  },
  
  instructionsContainer: {
    marginTop: '25px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  
  instructionsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },
  
  instructions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  
  instructionItem: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
  },
  
  instructionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    margin: '0 0 8px 0',
  },
  
  instructionText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
  },
};

export default IssueReceiptScreen;