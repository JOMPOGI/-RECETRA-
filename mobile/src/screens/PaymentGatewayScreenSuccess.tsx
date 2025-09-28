import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { paymongoService } from '../services/paymongoService';
import { emailService } from '../services/emailService';
import { addReceipt } from '../data/mockData';
import ReceiptTemplate from '../components/ReceiptTemplate';

const PaymentGatewayScreenSuccess = ({ navigation, route }: any) => {
  const [state, setState] = useState({ loading: true, error: '', receipt: null });

  useEffect(() => {
    const run = async () => {
      try {
        // In mobile, we'll simulate the success flow since we can't get URL params
        // This would normally come from PayMongo redirect parameters
        console.log('📱 Mobile: Simulating payment success confirmation');

        // For demo purposes, we'll create a successful receipt
        const receiptNumber = `OR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        
        const receipt = {
          id: `receipt_${Date.now()}`,
          receiptNumber,
          payer: 'Demo User', // This would come from form data in real implementation
          payerEmail: 'demo@example.com',
          amount: 1000, // This would come from payment data
          purpose: 'Test Payment',
          category: 'General',
          organization: 'Demo Organization',
          issuedBy: 'PayMongo Gateway',
          issuedAt: new Date().toISOString(),
          templateId: 'digital_payment',
          paymentStatus: 'completed',
          emailStatus: 'pending',
          isDigital: true,
          providerRef: `mock_${Date.now()}`
        };

        addReceipt(receipt);

        // Send email notification
        if (receipt.payerEmail) {
          try {
            const emailResult = await emailService.sendReceiptEmail(
              {
                customer_name: receipt.payer,
                amount_formatted: `₱${receipt.amount.toLocaleString()}`,
                date_formatted: new Date(receipt.issuedAt).toLocaleString(),
                receipt_html: `<p>Payment for ${receipt.purpose} — ${receipt.organization}</p>`
              },
              receipt.payerEmail
            );

            receipt.emailStatus = emailResult.success ? 'sent' : 'failed';
          } catch (e) {
            receipt.emailStatus = 'failed';
          }
        }

        setState({ loading: false, error: '', receipt });
      } catch (err: any) {
        setState({ loading: false, error: err?.message || 'Payment confirmation failed', receipt: null });
      }
    };
    run();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Payment Success</Text>
        </View>

        <View style={styles.content}>
          {state.loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Confirming payment...</Text>
            </View>
          )}
          
          {!state.loading && state.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Payment Confirmation Failed</Text>
              <Text style={styles.errorText}>{state.error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {!state.loading && state.receipt && (
            <View style={styles.successContainer}>
              <View style={styles.successHeader}>
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.statusText}>Completed</Text>
                </View>
              </View>
              
              <Text style={styles.successMessage}>
                We emailed your receipt to {state.receipt.payerEmail}.
              </Text>
              
              <View style={styles.receiptSection}>
                <Text style={styles.receiptSectionTitle}>Digital Receipt</Text>
                <ReceiptTemplate 
                  receipt={state.receipt} 
                  organization={state.receipt.organization} 
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
                      backgroundColor: state.receipt.emailStatus === 'sent' ? '#10b981' : 
                        state.receipt.emailStatus === 'pending' ? '#f59e0b' : '#ef4444'
                    }
                  ]}>
                    <Text style={styles.statusText}>{state.receipt.emailStatus}</Text>
                  </View>
                </View>
                <Text style={styles.emailStatusNote}>
                  Receipt has been sent to: {state.receipt.payerEmail}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => navigation.navigate('ViewerDashboard')}
              >
                <Text style={styles.homeButtonText}>Back to Dashboard</Text>
              </TouchableOpacity>
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
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  successHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46',
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
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
    lineHeight: 24,
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
  homeButton: {
    backgroundColor: '#1e3a8a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentGatewayScreenSuccess;
