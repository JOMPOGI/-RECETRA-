import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { paymongoService } from '../services/paymongoService';
import { emailService } from '../services/emailService';
import { addReceipt } from '../data/mockData';

interface PaymentDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      paymentData: any;
      checkoutUrl: string;
      linkId: string;
    };
  };
}

const PaymentDetailsScreen: React.FC<PaymentDetailsScreenProps> = ({ navigation, route }) => {
  const { paymentData, checkoutUrl, linkId } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [countdown, setCountdown] = useState(10); // Auto-proceed countdown

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handlePayNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePayNow = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if this is test mode (no API keys)
      const isTestMode = !process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY;

      if (isTestMode) {
        // Test mode: simulate successful payment immediately
        console.log('📱 Mobile: Test mode - simulating successful payment');
        
        // Generate receipt
        const receipt = await generateReceipt();
        
        // Send email
        await sendReceiptEmail(receipt);
        
        setPaymentStatus('completed');
        
        // Navigate to success screen after a brief delay
        setTimeout(() => {
          navigation.navigate('PaymentGatewayScreenSuccess', { receipt });
        }, 1500);
        
      } else {
        // Real mode: check actual payment status
        const statusResult = await paymongoService.getPaymentLink(linkId);
        
        if (statusResult.success) {
          const isPaid = statusResult.link?.attributes?.status === 'paid' || 
                        statusResult.link?.attributes?.paid;
          
          if (isPaid) {
            // Payment successful
            const receipt = await generateReceipt();
            await sendReceiptEmail(receipt);
            setPaymentStatus('completed');
            
            setTimeout(() => {
              navigation.navigate('PaymentGatewayScreenSuccess', { receipt });
            }, 1500);
          } else {
            // Payment not yet completed
            setPaymentStatus('failed');
            Alert.alert(
              'Payment Not Completed',
              'The payment was not completed. Please try again.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
        } else {
          throw new Error('Failed to check payment status');
        }
      }
      
    } catch (error: any) {
      console.error('Payment processing error:', error);
      setPaymentStatus('failed');
      Alert.alert(
        'Payment Failed',
        error.message || 'Payment processing failed. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const generateReceipt = async () => {
    const currentYear = new Date().getFullYear();
    const receiptCount = Math.floor(Math.random() * 9999) + 1;
    const receiptNumber = `OR-${currentYear}-${receiptCount.toString().padStart(4, '0')}`;

    const receiptData = {
      receiptNumber,
      payer: paymentData.payerName,
      payerEmail: paymentData.payerEmail,
      amount: Number(paymentData.amount),
      purpose: paymentData.purpose,
      category: paymentData.category,
      organization: paymentData.organization,
      issuedBy: 'PayMongo Gateway',
      issuedAt: new Date().toISOString(),
      templateId: paymentData.template,
      emailStatus: 'pending' as const,
      paymentStatus: 'completed' as const,
      paymentMethod: 'PayMongo' as const,
      isDigital: true,
      providerRef: linkId
    };

    return addReceipt(receiptData);
  };

  const sendReceiptEmail = async (receipt: any) => {
    try {
      const emailResult = await emailService.sendReceiptEmail({
        customer_name: receipt.payer,
        amount_formatted: `₱${(Number(receipt.amount) || 0).toFixed(2)}`,
        date_formatted: new Date(receipt.issuedAt).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        receipt_html: `<p>Payment for ${receipt.purpose} — ${receipt.organization}</p>`
      }, paymentData.payerEmail);
      
      receipt.emailStatus = emailResult.success ? 'sent' : 'failed';
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      receipt.emailStatus = 'failed';
    }
  };

  const openPayMongoCheckout = () => {
    Linking.openURL(checkoutUrl).catch(err => {
      console.error('Failed to open PayMongo checkout:', err);
      Alert.alert('Error', 'Failed to open payment page. Please try again.');
    });
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'pending': return 'Ready to Pay';
      case 'processing': return 'Processing Payment...';
      case 'completed': return 'Payment Successful!';
      case 'failed': return 'Payment Failed';
      default: return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Payment Details</Text>
        </View>

        <View style={styles.content}>
          {/* Payment Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Organization:</Text>
              <Text style={styles.summaryValue}>{paymentData.organization}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount:</Text>
              <Text style={styles.summaryValue}>₱{paymentData.amount}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Purpose:</Text>
              <Text style={styles.summaryValue}>{paymentData.purpose}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payer:</Text>
              <Text style={styles.summaryValue}>{paymentData.payerName}</Text>
            </View>
          </View>

          {/* PayMongo Checkout Info */}
          <View style={styles.checkoutContainer}>
            <Text style={styles.sectionTitle}>PayMongo Checkout</Text>
            <Text style={styles.checkoutDescription}>
              Your payment has been prepared. You can proceed with the payment using GCash or credit card.
            </Text>
            
            <View style={styles.checkoutUrlContainer}>
              <Text style={styles.checkoutUrlLabel}>Checkout URL:</Text>
              <Text style={styles.checkoutUrl}>{checkoutUrl}</Text>
            </View>

            <TouchableOpacity style={styles.openCheckoutButton} onPress={openPayMongoCheckout}>
              <Text style={styles.openCheckoutButtonText}>Open PayMongo Checkout</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Status */}
          <View style={styles.statusContainer}>
            <Text style={styles.sectionTitle}>Payment Status</Text>
            
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>

            {paymentStatus === 'pending' && countdown > 0 && (
              <Text style={styles.countdownText}>
                Auto-proceeding in {countdown} seconds...
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {paymentStatus === 'pending' && (
              <TouchableOpacity
                style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
                onPress={handlePayNow}
                disabled={isProcessing}
              >
                <Text style={styles.payButtonText}>
                  {isProcessing ? 'Processing...' : 'Pay Now'}
                </Text>
              </TouchableOpacity>
            )}

            {paymentStatus === 'completed' && (
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => navigation.navigate('PaymentGatewayScreenSuccess')}
              >
                <Text style={styles.successButtonText}>View Receipt</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  checkoutContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  checkoutDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  checkoutUrlContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  checkoutUrlLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  checkoutUrl: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  openCheckoutButton: {
    backgroundColor: '#1e3a8a',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  openCheckoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  countdownText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
  },
  payButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentDetailsScreen;
