import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { mockOrganizations, mockCategories, addReceipt } from '../data/mockData';
import { paymongoService } from '../services/paymongoService';
import { emailService } from '../services/emailService';
import ReceiptTemplate from '../components/ReceiptTemplate';

const PaymentGatewayScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  
  const [paymentData, setPaymentData] = useState({
    organization: '',
    category: '',
    amount: '',
    purpose: '',
    payerName: '',
    payerEmail: '',
    template: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Form validation
  const validatePaymentForm = () => {
    if (!paymentData.organization) {
      setPaymentResult({
        success: false,
        message: 'Please select an organization',
        error: 'validation'
      });
      return false;
    }
    if (!paymentData.category) {
      setPaymentResult({
        success: false,
        message: 'Please select a category',
        error: 'validation'
      });
      return false;
    }
    if (!paymentData.amount || isNaN(Number(paymentData.amount)) || Number(paymentData.amount) <= 0) {
      setPaymentResult({
        success: false,
        message: 'Please enter a valid amount',
        error: 'validation'
      });
      return false;
    }
    if (!paymentData.purpose) {
      setPaymentResult({
        success: false,
        message: 'Please enter a purpose',
        error: 'validation'
      });
      return false;
    }
    if (!paymentData.payerName.trim()) {
      setPaymentResult({
        success: false,
        message: 'Please enter payer name',
        error: 'validation'
      });
      return false;
    }
    if (!paymentData.payerEmail.trim() || !paymentData.payerEmail.includes('@')) {
      setPaymentResult({
        success: false,
        message: 'Please enter a valid email address',
        error: 'validation'
      });
      return false;
    }
    if (!paymentData.template) {
      setPaymentResult({
        success: false,
        message: 'Please select a template',
        error: 'validation'
      });
      return false;
    }
    return true;
  };
  const generateReceiptHtml = (receipt: any): string => {
  return `
    <table style="width:100%; border-collapse:collapse;">
      <tr><th style="text-align:left;">Receipt No.</th><td>${receipt.receiptNumber}</td></tr>
      <tr><th style="text-align:left;">Customer</th><td>${receipt.payer}</td></tr>
      <tr><th style="text-align:left;">Amount</th><td>₱${receipt.amount.toFixed(2)}</td></tr>
      <tr><th style="text-align:left;">Purpose</th><td>${receipt.purpose}</td></tr>
      <tr><th style="text-align:left;">Date</th><td>${new Date(receipt.issuedAt).toLocaleDateString()}</td></tr>
    </table>
  `;
};

  // Payment processing
  const handlePaymentSubmit = async () => {
    if (!validatePaymentForm()) return;

    setIsProcessing(true);
    try {
      // Process payment through PayMongo
      const paymentResult = await paymongoService.processPayment({
        amount: Number(paymentData.amount),
        currency: 'PHP',
        description: `${paymentData.purpose} - ${paymentData.organization}`,
        payerName: paymentData.payerName,
        payerEmail: paymentData.payerEmail,
        organization: paymentData.organization,
        category: paymentData.category
      });

      if (paymentResult.success) {
        // Generate receipt number
        const currentYear = new Date().getFullYear();
        const receiptCount = Math.floor(Math.random() * 9999) + 1;
        const receiptNumber = `OR-${currentYear}-${receiptCount.toString().padStart(4, '0')}`;

        // Create receipt data
        const receiptData = {
          receiptNumber,
          payer: paymentData.payerName,
          amount: Number(paymentData.amount),
          purpose: paymentData.purpose,
          category: paymentData.category,
          organization: paymentData.organization,
          issuedBy: user?.fullName || 'System',
          issuedAt: new Date().toISOString(),
          templateId: paymentData.template,
          emailStatus: 'pending' as const,
          paymentStatus: 'completed' as const,
          paymentMethod: 'Paymongo' as const,
        };

        // Add receipt to mock data
        const newReceipt = addReceipt(receiptData);

        // Send email notification
        // Send email notification
let emailStatus = 'failed';
try {
  const emailResult = await emailService.sendReceiptEmail({
    customer_name: newReceipt.payer,
    amount_formatted: `₱${(Number(newReceipt.amount) || 0).toFixed(2)}`,
    date_formatted: new Date(newReceipt.issuedAt).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    receipt_html: generateReceiptHtml(newReceipt)
  }, paymentData.payerEmail);
  emailStatus = emailResult.success ? 'sent' : 'failed';
} catch (emailError) {
  console.error('Email sending failed:', emailError);
}

        // Update receipt with email status
        newReceipt.emailStatus = emailStatus as 'sent' | 'failed';

        // Set payment result
        setPaymentResult({
          success: true,
          message: 'Payment processed successfully! Receipt has been generated and sent to your email.',
          receipt: newReceipt,
          paymentIntent: paymentResult.paymentIntent,
          clientKey: paymentResult.clientKey
        });

      } else {
        setPaymentResult({
          success: false,
          message: paymentResult.error || 'Payment failed',
          error: 'payment'
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentResult({
        success: false,
        message: 'Payment processing failed. Please try again.',
        error: 'payment'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Payment Gateway</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Configure your payment and proceed to PayMongo</Text>
          
          {/* Payment Configuration Form */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Payment Configuration</Text>
            
            {/* Organization Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization *</Text>
              <View style={styles.dropdown}>
                <Text style={styles.dropdownText}>
                  {paymentData.organization || 'Select Organization'}
                </Text>
              </View>
              <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
                {mockOrganizations.map(org => (
                  <TouchableOpacity
                    key={org.id}
                    style={styles.option}
                    onPress={() => setPaymentData(prev => ({ ...prev, organization: org.name }))}
                  >
                    <Text style={styles.optionText}>{org.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.dropdown}>
                <Text style={styles.dropdownText}>
                  {paymentData.category || 'Select Category'}
                </Text>
              </View>
              <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
                {mockCategories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.option}
                    onPress={() => setPaymentData(prev => ({ ...prev, category: category.name }))}
                  >
                    <Text style={styles.optionText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount (PHP) *</Text>
              <TextInput
                style={styles.input}
                value={paymentData.amount}
                onChangeText={(text) => setPaymentData(prev => ({ ...prev, amount: text }))}
                placeholder="Enter amount"
                keyboardType="numeric"
              />
            </View>

            {/* Purpose Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purpose *</Text>
              <TextInput
                style={styles.input}
                value={paymentData.purpose}
                onChangeText={(text) => setPaymentData(prev => ({ ...prev, purpose: text }))}
                placeholder="Enter payment purpose"
              />
            </View>

            {/* Payer Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payer Name *</Text>
              <TextInput
                style={styles.input}
                value={paymentData.payerName}
                onChangeText={(text) => setPaymentData(prev => ({ ...prev, payerName: text }))}
                placeholder="Enter payer name"
              />
            </View>

            {/* Payer Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payer Email *</Text>
              <TextInput
                style={styles.input}
                value={paymentData.payerEmail}
                onChangeText={(text) => setPaymentData(prev => ({ ...prev, payerEmail: text }))}
                placeholder="Enter payer email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Template Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Receipt Template *</Text>
              <View style={styles.dropdown}>
                <Text style={styles.dropdownText}>
                  {paymentData.template ? 
                    `Template ${paymentData.template}` : 
                    'Select Template'
                  }
                </Text>
              </View>
              <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => setPaymentData(prev => ({ ...prev, template: '1' }))}
                >
                  <Text style={styles.optionText}>Student Organization Receipt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => setPaymentData(prev => ({ ...prev, template: '2' }))}
                >
                  <Text style={styles.optionText}>Administrative Receipt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => setPaymentData(prev => ({ ...prev, template: '3' }))}
                >
                  <Text style={styles.optionText}>General Services Receipt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => setPaymentData(prev => ({ ...prev, template: '4' }))}
                >
                  <Text style={styles.optionText}>Event Receipt</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
              onPress={handlePaymentSubmit}
              disabled={isProcessing}
            >
              <Text style={styles.submitButtonText}>
                {isProcessing ? 'Processing...' : 'Proceed to PayMongo Payment'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Payment Result */}
          {paymentResult && (
            <View style={styles.resultContainer}>
              {paymentResult.success ? (
                <>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>Payment Successful!</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                      <Text style={styles.statusText}>Completed</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.successMessage}>{paymentResult.message}</Text>
                  
                  {/* Receipt Template - Same as Encoder */}
                  <View style={styles.receiptSection}>
                    <Text style={styles.receiptSectionTitle}>Digital Receipt</Text>
                    <ReceiptTemplate 
                      receipt={paymentResult.receipt} 
                      organization={paymentResult.receipt.organization}
                      paymentMethod="Online"
                    />
                  </View>

                  {/* Email Status */}
                  <View style={styles.emailStatusSection}>
                    <Text style={styles.emailStatusTitle}>Email Delivery Status</Text>
                    <View style={styles.emailStatusRow}>
                      <Text style={styles.emailStatusLabel}>Status:</Text>
                      <View style={[
                        styles.statusBadge,
                        { 
                          backgroundColor: paymentResult.receipt.emailStatus === 'sent' ? '#10b981' : 
                            paymentResult.receipt.emailStatus === 'pending' ? '#f59e0b' : '#ef4444'
                        }
                      ]}>
                        <Text style={styles.statusText}>{paymentResult.receipt.emailStatus}</Text>
                      </View>
                    </View>
                    <Text style={styles.emailStatusNote}>
                      Receipt has been sent to: {paymentData.payerEmail}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.resultHeader}>
                    <Text style={[styles.resultTitle, { color: '#ef4444' }]}>Payment Failed</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#ef4444' }]}>
                      <Text style={styles.statusText}>Error</Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.successMessage, { color: '#ef4444' }]}>{paymentResult.message}</Text>
                  
                  <View style={styles.errorSection}>
                    <Text style={styles.errorTitle}>Please check the following:</Text>
                    <Text style={styles.errorText}>• Ensure all required fields are filled</Text>
                    <Text style={styles.errorText}>• Verify email format is correct</Text>
                    <Text style={styles.errorText}>• Check that amount is a valid number</Text>
                    <Text style={styles.errorText}>• Try again after a moment</Text>
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  optionsContainer: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderTopWidth: 0,
    backgroundColor: '#fff',
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  successMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emailStatusLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  emailStatusNote: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorSection: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 4,
  },
});

export default PaymentGatewayScreen;