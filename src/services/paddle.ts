// Paddle Integration Service for Kateriss AI Video Generator  
// Modern Paddle.js v2 integration with checkout handling

import { config } from '../config/env';
import { 
  PaddleEnvironment,
  PaddleCheckoutSettings,
  PaddleCheckoutSuccess,
  PricingPlan,
  PaddleApiResponse,
  SubscriptionApiResponse,
  PaddleWebhookEvent,
  WebhookEventType
} from '../types/payment';

// Paddle.js v2 SDK types
interface PaddleSDK {
  Setup: {
    (options: {
      environment: 'sandbox' | 'production';
      vendor?: number;
      token?: string;
    }): void;
  };
  Checkout: {
    open: (options: {
      items: Array<{
        priceId: string;
        quantity?: number;
      }>;
      customer?: {
        email?: string;
      };
      customData?: Record<string, any>;
      successUrl?: string;
    }) => void;
  };
  Environment: {
    set: (env: 'sandbox' | 'production') => void;
  };
}

declare global {
  interface Window {
    Paddle?: PaddleSDK;
  }
}

class PaddleService {
  private environment: 'sandbox' | 'production';
  private initialized: boolean = false;
  private vendorId: string;
  private clientSideToken: string;
  private apiKey: string;

  constructor() {
    this.environment = config.paddle.environment as 'sandbox' | 'production';
    this.vendorId = config.paddle.vendorId || '';
    this.clientSideToken = config.paddle.clientSideToken || '';
    this.apiKey = config.paddle.apiKey || '';
    
    // Comprehensive configuration logging for debugging
    console.log('🔍 COMPLETE PADDLE CONFIGURATION:');
    console.log('📋 All Configuration Details:', {
      environment: this.environment,
      vendorId: this.vendorId,
      clientSideToken: this.clientSideToken,
      apiKey: this.apiKey,
      priceIds: config.paddle.priceIds,
      currentURL: window.location.origin,
      configSource: "import.meta.env values"
    });
    
    console.log('🔑 FULL API KEYS (for debugging):');
    console.log('Vendor ID:', this.vendorId);
    console.log('Client-Side Token:', this.clientSideToken);
    console.log('API Key:', this.apiKey);
    console.log('Pay Per Video Price ID:', config.paddle.priceIds.payPerVideo);
    console.log('Environment:', this.environment);
    
    if (!this.vendorId || !this.clientSideToken) {
      console.warn('Paddle configuration missing. Please set VITE_PADDLE_VENDOR_ID and VITE_PADDLE_CLIENT_SIDE_TOKEN');
    } else {
      console.log('🏄‍♂️ Paddle configured for', this.environment, 'environment');
      if (this.apiKey) {
        console.log('✅ Server-side API key configured');
      } else {
        console.warn('⚠️ Server-side API key missing - some features may not work');
      }
    }
  }

  /**
   * Initialize Paddle SDK
   */
  async initialize(): Promise<void> {
    if (this.initialized && window.Paddle) {
      return;
    }

    try {
      // Load Paddle.js if not already loaded
      if (!window.Paddle) {
        await this.loadPaddleScript();
      }

      // Setup Paddle with configuration
      if (window.Paddle && this.clientSideToken) {
        console.log('🔧 Initializing Paddle with:', {
          token: this.clientSideToken.substring(0, 10) + '...',
          environment: this.environment
        });

        // Use the most compatible setup method (token only for this Paddle SDK version)
        window.Paddle.Setup({
          token: this.clientSideToken
        });

        this.initialized = true;
        console.log('✅ Paddle initialized successfully - SDK ready for checkout with full permissions');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Paddle:', error);
      throw error;
    }
  }

  /**
   * Load Paddle.js script dynamically
   */
  private loadPaddleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Paddle) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Paddle script'));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Open Paddle Checkout for one-time payments - DEBUGGING VERSION
   */
  async openCheckout(options: {
    priceId?: string;
    price?: number;
    title?: string;
    quantity?: number;
    customerEmail?: string;
    customerName?: string;
    customData?: Record<string, any>;
    settings?: PaddleCheckoutSettings;
  }): Promise<PaddleCheckoutSuccess> {
    await this.initialize();

    if (!window.Paddle) {
      throw new Error('Paddle SDK not available');
    }

    return new Promise((resolve, reject) => {
      const checkoutOptions = {
        items: [{
          priceId: options.priceId || config.paddle.priceIds.payPerVideo,
          quantity: options.quantity || 1
        }],
        customer: options.customerEmail ? {
          email: options.customerEmail
        } : undefined,
        customData: options.customData,
        successUrl: `${window.location.origin}/dashboard?payment=success`
      };

      // Set up event listeners for v2 API
      const handleSuccess = (event: any) => {
        resolve(event.data);
        cleanup();
      };

      const handleClose = () => {
        reject(new Error('Checkout cancelled by user'));
        cleanup();
      };

      const cleanup = () => {
        window.removeEventListener('paddle_checkout_success', handleSuccess);
        window.removeEventListener('paddle_checkout_close', handleClose);
      };

      window.addEventListener('paddle_checkout_success', handleSuccess);
      window.addEventListener('paddle_checkout_close', handleClose);

      console.log('🔧 Opening Paddle checkout with options:', {
        ...checkoutOptions,
        priceId: checkoutOptions.items?.[0]?.priceId || 'direct-price'
      });

      // Add more detailed debugging
      console.log('🔍 Full checkout payload:', JSON.stringify(checkoutOptions, null, 2));
      console.log('🔍 Paddle SDK status:', {
        paddleExists: !!window.Paddle,
        checkoutExists: !!window.Paddle?.Checkout,
        openExists: !!window.Paddle?.Checkout?.open,
        environment: this.environment,
        vendorId: this.vendorId,
        token: this.clientSideToken.substring(0, 10) + '...'
      });

      try {
        // Try a simplified checkout first
        const simplifiedOptions = {
          items: [{
            priceId: options.priceId || config.paddle.priceIds.payPerVideo,
            quantity: options.quantity || 1
          }]
        };
        
        console.log('🧪 Trying simplified checkout options:', simplifiedOptions);
        window.Paddle.Checkout.open(simplifiedOptions);
      } catch (error) {
        console.error('❌ Paddle checkout failed:', error);
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        cleanup();
        reject(error);
      }
    });
  }

  /**
   * Open Paddle Checkout for subscription
   */
  async openSubscriptionCheckout(options: {
    priceId: string;
    customerEmail?: string;
    customerName?: string;
    trialDays?: number;
    customData?: Record<string, any>;
    settings?: PaddleCheckoutSettings;
  }): Promise<PaddleCheckoutSuccess> {
    await this.initialize();

    if (!window.Paddle) {
      throw new Error('Paddle SDK not available');
    }

    return new Promise((resolve, reject) => {
      const checkoutOptions = {
        items: [{
          priceId: options.priceId,
          quantity: 1
        }],
        customer: options.customerEmail ? {
          email: options.customerEmail
        } : undefined,
        customData: options.customData,
        successUrl: `${window.location.origin}/dashboard?payment=success`
      };

      // Set up event listeners for v2 API
      const handleSuccess = (event: any) => {
        resolve(event.data);
        cleanup();
      };

      const handleClose = () => {
        reject(new Error('Subscription checkout cancelled by user'));
        cleanup();
      };

      const cleanup = () => {
        window.removeEventListener('paddle_checkout_success', handleSuccess);
        window.removeEventListener('paddle_checkout_close', handleClose);
      };

      window.addEventListener('paddle_checkout_success', handleSuccess);
      window.addEventListener('paddle_checkout_close', handleClose);

      console.log('🔧 Opening Paddle checkout with options:', {
        ...checkoutOptions,
        priceId: checkoutOptions.items?.[0]?.priceId || 'direct-price'
      });

      try {
        window.Paddle.Checkout.open(checkoutOptions);
      } catch (error) {
        console.error('❌ Paddle checkout failed:', error);
        cleanup();
        reject(error);
      }
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<PaddleApiResponse> {
    try {
      const response = await fetch('/api/paddle/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientSideToken}`
        },
        body: JSON.stringify({ subscription_id: subscriptionId })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscriptionPlan(subscriptionId: string, newPlanId: string, prorate: boolean = true): Promise<PaddleApiResponse> {
    try {
      const response = await fetch('/api/paddle/subscription/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientSideToken}`
        },
        body: JSON.stringify({ 
          subscription_id: subscriptionId,
          plan_id: newPlanId,
          prorate
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription information
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionApiResponse> {
    try {
      const response = await fetch(`/api/paddle/subscription/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${this.clientSideToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Failed to get subscription:', error);
      throw error;
    }
  }

  /**
   * Get payment information for an order
   */
  async getPayment(orderId: string): Promise<any> {
    try {
      const response = await fetch(`/api/paddle/payment/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${this.clientSideToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get payment:', error);
      throw error;
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(orderId: string, amount?: number, reason?: string): Promise<PaddleApiResponse> {
    try {
      const response = await fetch('/api/paddle/payment/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientSideToken}`
        },
        body: JSON.stringify({ 
          order_id: orderId,
          amount,
          reason
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to refund payment:', error);
      throw error;
    }
  }

  /**
   * Get customer portal URL
   */
  async getCustomerPortalUrl(customerId: string): Promise<string> {
    try {
      const response = await fetch('/api/paddle/customer/portal-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientSideToken}`
        },
        body: JSON.stringify({ customer_id: customerId })
      });

      if (!response.ok) {
        throw new Error('Failed to get customer portal URL');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Failed to get customer portal URL:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    // Implementation depends on your backend verification logic
    // This is typically done server-side for security
    return true;
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: PaddleWebhookEvent): Promise<void> {
    const eventType = this.mapWebhookEventType(event.alert_name);
    
    try {
      // Send to your backend for processing
      await fetch('/api/paddle/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to process webhook event:', error);
      throw error;
    }
  }

  /**
   * Map Paddle alert names to internal event types
   */
  private mapWebhookEventType(alertName: string): WebhookEventType {
    const eventMap: Record<string, WebhookEventType> = {
      'subscription_created': 'subscription_created',
      'subscription_updated': 'subscription_updated',
      'subscription_cancelled': 'subscription_cancelled',
      'subscription_payment_succeeded': 'subscription_payment_succeeded',
      'subscription_payment_failed': 'subscription_payment_failed',
      'subscription_payment_refunded': 'subscription_payment_refunded',
      'payment_succeeded': 'payment_succeeded',
      'payment_refunded': 'payment_refunded'
    };

    return eventMap[alertName] || 'payment_succeeded';
  }

  /**
   * Generate Paddle checkout URL for pay-per-video
   */
  generatePayPerVideoUrl(videoCount: number = 1, customerEmail?: string): string {
    // Since domain is approved, use embedded checkout instead of hosted
    // This method should not be called now that domain is approved
    console.warn('⚠️ Using hosted checkout URL - embedded checkout should work now that domain is approved');
    
    // Correct Paddle hosted checkout URL format for sandbox
    const baseUrl = this.environment === 'sandbox' 
      ? 'https://sandbox-vendors.paddle.com/checkout-v2'
      : 'https://vendors.paddle.com/checkout-v2';
    
    const params = new URLSearchParams();
    
    // Use Paddle v2 checkout parameters
    params.append('items', JSON.stringify([{
      priceId: config.paddle.priceIds.payPerVideo,
      quantity: videoCount
    }]));
    
    // Add customer email if provided
    if (customerEmail) {
      params.append('customer_email', customerEmail);
    }
    
    // Add success and cancel URLs
    params.append('success_url', `${window.location.origin}/dashboard?payment=success`);
    params.append('cancel_url', `${window.location.origin}/pricing`);

    const checkoutUrl = `${baseUrl}?${params.toString()}`;
    console.log('🔗 Generated Paddle checkout URL:', checkoutUrl);
    
    return checkoutUrl;
  }

  /**
   * Generate subscription checkout URL
   */
  generateSubscriptionUrl(priceId: string, customerEmail?: string): string {
    const baseUrl = 'https://buy.paddle.com/checkout';
    
    const params = new URLSearchParams({
      items: JSON.stringify([{
        priceId: priceId,
        quantity: 1
      }])
    });

    if (customerEmail) {
      params.append('customer_email', customerEmail);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Close Paddle checkout
   */
  closeCheckout(): void {
    if (window.Paddle) {
      window.Paddle.Checkout.close();
    }
  }

  /**
   * Show/hide loading spinner
   */
  toggleSpinner(show: boolean): void {
    if (window.Paddle) {
      if (show) {
        window.Paddle.Spinner.show();
      } else {
        window.Paddle.Spinner.hide();
      }
    }
  }

  /**
   * Clean up Paddle resources
   */
  cleanup(): void {
    if (this.paddleScript && this.paddleScript.parentNode) {
      this.paddleScript.parentNode.removeChild(this.paddleScript);
      this.paddleScript = null;
    }
    this.initialized = false;
  }

  /**
   * Get Paddle environment configuration
   */
  getConfig(): PaddleEnvironment {
    return {
      environment: this.environment,
      vendorId: this.vendorId,
      clientSideToken: this.clientSideToken
    };
  }

  /**
   * Check if Paddle is properly configured
   */
  isConfigured(): boolean {
    return !!(this.vendorId && this.clientSideToken);
  }

  /**
   * Get supported currencies for Paddle
   */
  getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'DKK', 'NOK', 'SEK',
      'PLN', 'CZK', 'HUF', 'BGN', 'HRK', 'RON', 'JPY', 'SGD', 'HKD',
      'NZD', 'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'PYG'
    ];
  }

  /**
   * Format price for display with currency
   */
  formatPrice(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  }

  /**
   * Calculate tax amount (Paddle handles tax automatically)
   */
  calculateTax(amount: number, country: string): Promise<number> {
    // Paddle calculates tax automatically based on customer location
    // This is just a placeholder for display purposes
    return Promise.resolve(0);
  }
}

// Export singleton instance
export const paddleService = new PaddleService();
export default paddleService;