import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { paymongoService } from '../services/paymongoService';
import { emailService } from '../services/emailService';
import ReactDOMServer from 'react-dom/server';
import ReceiptTemplate from '../components/ReceiptTemplate';
import { addReceipt } from '../data/mockData';
import qrcode from 'qrcode';

const PaymentGatewayScreenSuccess = () => {
  const [state, setState] = useState({ loading: true, error: '', receipt: null });

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        // PayMongo may return different param keys depending on flow
        let sourceId = url.searchParams.get('id') || url.searchParams.get('source');
        if (!sourceId) {
          // Some implementations use nested source[id]
          sourceId = url.searchParams.get('source[id]');
        }
        if (!sourceId) {
          // Fallback: use stored source id from session when redirect lacks query params
          sourceId = sessionStorage.getItem('pg_source_id');
        }
        // If we still don't have a source, try to confirm via a stored payment link
        const linkId = sessionStorage.getItem('pg_link_id');
        if (!sourceId && linkId) {
          const link = await paymongoService.getPaymentLink(linkId);
          if (link.success) {
            const paid = link.link?.attributes?.status === 'paid' || link.link?.attributes?.paid;
            if (!paid) {
              throw new Error('Payment link not paid');
            }
            // Continue generating receipt using stored form data
          } else {
            throw new Error(link.error || 'Failed to fetch payment link');
          }
        }
        if (!sourceId && !linkId) {
          throw new Error('Missing PayMongo source id');
        }

        if (sourceId) {
          const sourceRes = await paymongoService.getSource(sourceId);
          if (!sourceRes.success) {
            throw new Error(sourceRes.error || 'Failed to confirm payment');
          }

          const status = sourceRes.status;
          if (status === 'chargeable') {
            const form = JSON.parse(sessionStorage.getItem('pg_form') || '{}');
            const charge = await paymongoService.createPaymentFromSource({
              sourceId,
              amount: form.amount || '0',
              currency: 'PHP',
              description: form.purpose || ''
            });
            if (!charge.success) throw new Error(charge.error || 'Failed to create payment');
          } else if (status !== 'paid' && status !== 'succeeded') {
            throw new Error(`Unexpected payment status: ${status}`);
          }
        }

        // Load form data saved before redirect
        const form = JSON.parse(sessionStorage.getItem('pg_form') || '{}');

        const receiptNumber = `OR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        const qrCodeData = JSON.stringify({
          receiptNumber,
          amount: parseFloat(form.amount || '0'),
          payer: form.payerName,
          organization: form.organization,
          purpose: form.purpose,
          timestamp: Date.now()
        });

        const receipt = {
          id: `receipt_${Date.now()}`,
          receiptNumber,
          payer: form.payerName,
          payerEmail: form.payerEmail,
          amount: parseFloat(form.amount || '0'),
          purpose: form.purpose,
          category: form.category,
          organization: form.organization,
          issuedBy: 'PayMongo Gateway',
          issuedAt: new Date().toISOString(),
          templateId: 'digital_payment',
          qrCode: qrCodeData,
          paymentStatus: 'completed',
          emailStatus: 'pending',
          isDigital: true,
          providerRef: sourceId
        };

        addReceipt(receipt);

        if (form.payerEmail) {
          try {
            const qrImageDataUrl = await qrcode.toDataURL(receipt.qrCode, {
              errorCorrectionLevel: 'H',
              width: 120,
              margin: 1
            });

            const receiptHtml = ReactDOMServer.renderToStaticMarkup(
              <ReceiptTemplate
                receipt={receipt}
                organization={receipt.organization}
                paymentMethod="Online"
                inlineEmail={true}
                qrImageDataUrl={qrImageDataUrl}
                logoUrl="https://raw.githubusercontent.com/JOMPOGI/-RECETRA-/main/web/assets/Logo_with_Color.png"
              />
            );

            const emailResult = await emailService.sendReceiptEmail(
              {
                html: receiptHtml,
                amount_formatted: `₱${receipt.amount.toLocaleString()}`,
                date_formatted: new Date(receipt.issuedAt).toLocaleString(),
                customerName: receipt.payer
              },
              form.payerEmail,
              {
                subject: `Receipt ${receiptNumber}`,
                supportContact: 'support@yourdomain.com',
                customerName: receipt.payer
              }
            );

            receipt.emailStatus = emailResult.success ? 'sent' : 'failed';
          } catch (e) {
            receipt.emailStatus = 'failed';
          }
        }

        setState({ loading: false, error: '', receipt });
      } catch (err) {
        setState({ loading: false, error: err?.message || 'Payment confirmation failed', receipt: null });
      }
    };
    run();
  }, []);

  return (
    <Layout title="Payment Success" showBackButton={true}>
      <div className="innerContainer">
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          {state.loading && <p>Confirming payment...</p>}
          {!state.loading && state.error && (
            <div>
              <h3 style={{ color: '#dc2626' }}>Payment Confirmation Failed</h3>
              <p>{state.error}</p>
            </div>
          )}
          {!state.loading && state.receipt && (
            <div>
              <h3 style={{ color: '#065f46' }}>Payment Successful!</h3>
              <p>We emailed your receipt to {state.receipt.payerEmail}.</p>
              <div style={{ marginTop: 16 }}>
                <ReceiptTemplate receipt={state.receipt} organization={state.receipt.organization} paymentMethod="Online" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PaymentGatewayScreenSuccess;


