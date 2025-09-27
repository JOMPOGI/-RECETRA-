/**
 * PayMongo Service for Web Application
 * Handles real PayMongo payment gateway integration
 */

class PayMongoService {
  constructor() {
    this.baseURL = 'https://api.paymongo.com/v1';
    this.secretKey = import.meta.env.VITE_PAYMONGO_SECRET_KEY;
    this.publicKey = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY;
    
    if (!this.secretKey || !this.publicKey) {
      console.warn('⚠️ PayMongo API keys not found. Please set REACT_APP_PAYMONGO_SECRET_KEY and REACT_APP_PAYMONGO_PUBLIC_KEY in your environment variables.');
    }
    
    console.log('💳 PayMongo Service initialized');
  }

  /**
   * Makes authenticated API request to PayMongo
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {string} method - HTTP method
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, data = null, method = 'GET') {
    if (!this.secretKey) {
      console.warn('PayMongo secret key not configured, using mock response');
      // Return mock response for development
      return {
        data: {
          id: `mock_${Date.now()}`,
          attributes: {
            client_key: `mock_client_${Date.now()}`,
            amount: data?.data?.attributes?.amount || 0,
            currency: 'PHP',
            status: 'succeeded'
          }
        }
      };
    }

    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Basic ${btoa ? btoa(this.secretKey + ':') : Buffer.from(this.secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.errors?.[0]?.detail || 'PayMongo API error');
      }

      return result;
    } catch (error) {
      console.error('PayMongo API Error:', error);
      throw error;
    }
  }

  /**
   * Creates a payment intent
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment intent result
   */
  async createPaymentIntent(paymentData) {
    console.log('💳 PayMongo Service: Creating payment intent', paymentData);
    
    try {
      const data = {
        data: {
          attributes: {
            amount: Math.round(parseFloat(paymentData.amount) * 100), // Convert to centavos
            currency: 'PHP',
            description: paymentData.purpose,
            metadata: {
              organization: paymentData.organization,
              category: paymentData.category,
              payer_name: paymentData.payerName,
              payer_email: paymentData.payerEmail
            }
          }
        }
      };

      const result = await this.makeRequest('/payment_intents', data, 'POST');
      
      return {
        success: true,
        paymentIntentId: result.data.id,
        clientKey: result.data.attributes.client_key,
        amount: paymentData.amount,
        currency: 'PHP',
        status: result.data.attributes.status,
        message: 'Payment intent created successfully'
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create payment intent'
      };
    }
  }

  /**
   * Creates a PayMongo source (e.g., gcash) that returns a redirect URL
   * @param {Object} params - { amount, currency, type, description, successUrl, failedUrl, billing }
   */
  async createSource(params) {
    if (!this.secretKey) {
      console.warn('PayMongo secret key not configured, using mock checkout URL');
      return {
        success: true,
        sourceId: `src_mock_${Date.now()}`,
        checkoutUrl: `https://paymongo.test/mock_checkout/${Date.now()}`,
        message: 'Mock source created'
      };
    }

    const {
      amount,
      currency = 'PHP',
      type = 'gcash',
      description = '',
      successUrl,
      failedUrl,
      billing
    } = params;

    const data = {
      data: {
        attributes: {
          amount: Math.round(parseFloat(amount) * 100),
          currency,
          type,
          description,
          redirect: {
            success: successUrl,
            failed: failedUrl
          },
          billing: billing || undefined
        }
      }
    };

    try {
      const result = await this.makeRequest('/sources', data, 'POST');
      const source = result?.data;
      const checkoutUrl = source?.attributes?.redirect?.checkout_url;
      return {
        success: true,
        sourceId: source?.id,
        checkoutUrl,
        raw: result
      };
    } catch (error) {
      console.error('Error creating PayMongo source:', error);
      return {
        success: false,
        error: error.message || 'Failed to create source'
      };
    }
  }

  /**
   * Retrieves a source to check status after redirect
   * @param {string} sourceId
   */
  async getSource(sourceId) {
    try {
      const result = await this.makeRequest(`/sources/${sourceId}`, null, 'GET');
      return {
        success: true,
        source: result?.data,
        status: result?.data?.attributes?.status
      };
    } catch (error) {
      console.error('Error fetching PayMongo source:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Creates a payment from a chargeable source
   * @param {Object} params - { sourceId, amount, currency, description }
   */
  async createPaymentFromSource(params) {
    if (!this.secretKey) {
      return {
        success: true,
        payment: {
          id: `pay_mock_${Date.now()}`,
          attributes: { status: 'paid', amount: Math.round(parseFloat(params.amount) * 100) }
        }
      };
    }

    const { sourceId, amount, currency = 'PHP', description = '' } = params;
    const data = {
      data: {
        attributes: {
          amount: Math.round(parseFloat(amount) * 100),
          currency,
          description,
          source: {
            id: sourceId,
            type: 'source'
          }
        }
      }
    };

    try {
      const result = await this.makeRequest('/payments', data, 'POST');
      return { success: true, payment: result?.data };
    } catch (error) {
      console.error('Error creating PayMongo payment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Creates a PayMongo Payment Link and returns its checkout URL
   * Note: Running this on the client exposes your secret key. Prefer a backend in production.
   * @param {Object} params - { amount, description, remarks, paymentMethodTypes, metadata, successUrl, failedUrl }
   */
  async createPaymentLink(params) {
    if (!this.secretKey) {
      return {
        success: true,
        linkId: `link_mock_${Date.now()}`,
        checkoutUrl: `https://paymongo.test/mock_link/${Date.now()}`,
        message: 'Mock payment link created'
      };
    }

    const {
      amount,
      description = '',
      remarks = '',
      paymentMethodTypes = ['gcash', 'card'],
      metadata,
      successUrl,
      failedUrl
    } = params;

    const data = {
      data: {
        attributes: {
          amount: Math.round(parseFloat(amount) * 100),
          currency: 'PHP',
          description,
          remarks,
          payment_method_types: paymentMethodTypes,
          metadata: metadata || undefined,
          // Redirect URLs may not be honored by all accounts; safe to include
          redirect: (successUrl || failedUrl)
            ? { success: successUrl, failed: failedUrl }
            : undefined
        }
      }
    };

    try {
      const result = await this.makeRequest('/links', data, 'POST');
      const link = result?.data;
      const checkoutUrl = link?.attributes?.checkout_url;
      return {
        success: true,
        linkId: link?.id,
        checkoutUrl,
        raw: result
      };
    } catch (error) {
      console.error('Error creating PayMongo payment link:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch a PayMongo Payment Link by id
   */
  async getPaymentLink(linkId) {
    try {
      const result = await this.makeRequest(`/links/${linkId}`, null, 'GET');
      return { success: true, link: result?.data };
    } catch (error) {
      console.error('Error fetching PayMongo payment link:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Creates a payment method
   * @param {Object} paymentMethodData - Payment method data
   * @returns {Promise<Object>} Payment method result
   */
  async createPaymentMethod(paymentMethodData) {
    console.log('💳 PayMongo Service: Creating payment method', paymentMethodData);
    
    try {
      const data = {
        data: {
          attributes: {
            type: paymentMethodData.type,
            details: paymentMethodData.details
          }
        }
      };

      const result = await this.makeRequest('/payment_methods', data, 'POST');
      
      return {
        success: true,
        paymentMethodId: result.data.id,
        paymentMethod: result.data,
        message: 'Payment method created successfully'
      };
    } catch (error) {
      console.error('Error creating payment method:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create payment method'
      };
    }
  }

  /**
   * Attaches payment method to payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Attachment result
   */
  async attachPaymentMethod(paymentIntentId, paymentMethodId) {
    console.log('💳 PayMongo Service: Attaching payment method', { paymentIntentId, paymentMethodId });
    
    try {
      const data = {
        data: {
          attributes: {
            payment_method: paymentMethodId
          }
        }
      };

      const result = await this.makeRequest(`/payment_intents/${paymentIntentId}/attach`, data, 'POST');
      
      return {
        success: true,
        paymentIntent: result.data,
        message: 'Payment method attached successfully'
      };
    } catch (error) {
      console.error('Error attaching payment method:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to attach payment method'
      };
    }
  }

  /**
   * Processes a complete payment flow
   * @param {Object} paymentData - Complete payment information
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(paymentData) {
    console.log('💳 PayMongo Service: Processing payment', paymentData);
    
    try {
      // Step 1: Create payment intent
      const intentResult = await this.createPaymentIntent(paymentData);
      if (!intentResult.success) {
        return intentResult;
      }

      // For now, return the payment intent with client key
      // In a real implementation, you would redirect to PayMongo's payment page
      // or use their JavaScript SDK to handle payment method selection
      return {
        success: true,
        paymentIntentId: intentResult.paymentIntentId,
        clientKey: intentResult.clientKey,
        amount: paymentData.amount,
        currency: 'PHP',
        status: 'requires_payment_method',
        message: 'Payment intent created. Redirect to PayMongo payment page to complete payment.',
        paymentUrl: `https://paymongo.com/pay/${intentResult.paymentIntentId}` // This would be the actual PayMongo payment URL
      };
    } catch (error) {
      console.error('PayMongo processPayment error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Payment processing failed'
      };
    }
  }

  /**
   * Refunds a payment (placeholder)
   * @param {string} transactionId - Transaction ID to refund
   * @param {number} amount - Refund amount
   * @returns {Promise<Object>} Refund result
   */
  async refundPayment(transactionId, amount) {
    console.log('💳 PayMongo Service: Processing refund', { transactionId, amount });
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const isSuccess = Math.random() > 0.2;
    
    if (isSuccess) {
      return {
        success: true,
        refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        status: 'succeeded',
        message: 'Refund processed via placeholder service'
      };
    } else {
      return {
        success: false,
        error: 'Refund processing failed - placeholder service',
        status: 'failed'
      };
    }
  }

  /**
   * Gets payment status (placeholder)
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(paymentIntentId) {
    console.log('💳 PayMongo Service: Getting payment status', { paymentIntentId });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      paymentIntentId: paymentIntentId,
      status: 'succeeded',
      amount: 1000,
      currency: 'PHP',
      message: 'Payment status retrieved via placeholder service'
    };
  }
}

// Export singleton instance
export const paymongoService = new PayMongoService();

// Export class for testing or custom instances
export { PayMongoService };
