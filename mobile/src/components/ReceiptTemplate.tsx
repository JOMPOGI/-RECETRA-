import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width: screenWidth } = Dimensions.get('window');

const ReceiptTemplate = ({ receipt, organization, paymentMethod = 'Cash' }) => {
  // Convert amount to words (simplified)
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
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
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

  const orgDetails = getOrganizationDetails(organization || receipt.organization);
  const amountInWords = convertAmountToWords(receipt.amount) + ' Pesos';

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} horizontal={false}>
      <View style={styles.receiptContainer}>
        <View style={styles.receipt}>
          {/* Header with RECETRA Logo Only (match web style) */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/Logo_with_Color.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Receipt Title */}
          <View style={styles.titleSection}>
            <Text style={styles.receiptTitle}>ACKNOWLEDGMENT RECEIPT</Text>
          </View>

          {/* Receipt Header */}
          <View style={styles.receiptHeader}>
            <View style={styles.receiptHeaderRow}>
              <Text style={styles.noLabel}>NO: <Text style={styles.receiptNumberValue}>{receipt.receiptNumber}</Text></Text>
            </View>
            <View style={styles.receiptHeaderRow}>
              <Text style={styles.dateLabel}>Date: <Text style={styles.dateValue}>{formatDate(receipt.issuedAt)}</Text></Text>
            </View>
          </View>

          {/* Main Acknowledgment Text */}
          <View style={styles.acknowledgmentText}>
            <Text style={styles.acknowledgmentParagraph}>
              This is to acknowledge that{' '}
              <Text style={styles.underlined}>{orgDetails.fullName}</Text>{' '}
              received from{' '}
              <Text style={styles.underlined}>{receipt.payer}</Text>{' '}
              the amount of{' '}
              <Text style={styles.underlined}>{amountInWords}</Text>{' '}
              <Text style={styles.underlined}>(P {receipt.amount.toLocaleString()})</Text>{' '}
              as payment for{' '}
              <Text style={styles.underlined}>{receipt.purpose}</Text>.
            </Text>
          </View>

          {/* Payment Details */}
          <View style={styles.paymentDetailsSection}>
            <Text style={styles.paymentDetailsLabel}>Payment Details:</Text>
            <View style={styles.paymentOptions}>
              <Text style={styles.checkbox}>{paymentMethod === 'Cash' ? '☑' : '☐'} Cash</Text>
              <Text style={[styles.checkbox, {marginLeft: 24}]}>{paymentMethod === 'Online' ? '☑' : '☐'} Online</Text>
            </View>
          </View>

          {/* Received By Section */}
          <View style={styles.receivedBySection}>
            <View style={styles.receivedByRow}>
              <Text style={styles.receivedByLabel}>Received By:</Text>
              <Text style={styles.receivedByValue}>{receipt.issuedBy || 'System'}</Text>
            </View>
          </View>

          {/* QR Code Section */}
          {receipt.qrCode && (
            <View style={styles.qrCodeSection}>
              <View style={styles.qrCodeContainer}>
                <QRCode 
                  value={receipt.qrCode} 
                  size={72}
                />
              </View>
              <Text style={styles.qrCodeNote}>
                Scan this QR code to verify receipt authenticity
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  receiptContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  receipt: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 16,
    margin: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 0,
    marginTop: -24,
  },
  logo: {
    height: 140,
    width: 140,
    marginBottom: 0,
    alignSelf: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 24,
  },
  receiptTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
  },
  receiptHeaderRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginLeft: 0,
  },
  noLabel: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  receiptNumberValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  dateLabel: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  dateValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  acknowledgmentText: {
    marginBottom: 8,
    marginTop: 8,
    width: '100%',
  },
  acknowledgmentParagraph: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    textAlign: 'left',
  },
  underlined: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: '#000',
  },
  paymentDetailsSection: {
    marginBottom: 8,
    marginTop: 8,
    width: '100%',
  },
  paymentDetailsLabel: {
    fontSize: 15,
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  paymentOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  checkbox: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 0,
    marginRight: 8,
  },
  receivedBySection: {
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
  },
  receivedByRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  receivedByLabel: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  receivedByValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    textAlign: 'right',
    marginLeft: 8,
  },
  qrCodeSection: {
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    width: '100%',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  qrCodeNote: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});

export default ReceiptTemplate;