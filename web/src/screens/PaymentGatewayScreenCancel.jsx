import React from 'react';
import Layout from '../components/Layout';

const PaymentGatewayScreenCancel = () => {
  return (
    <Layout title="Payment Canceled" showBackButton={true}>
      <div className="innerContainer">
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h3 style={{ color: '#b45309' }}>Payment not completed</h3>
          <p>Your payment was canceled or failed. You can go back and try again.</p>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentGatewayScreenCancel;


