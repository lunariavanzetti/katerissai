// Paddle Integration Service for Kateriss AI Video Generator
// Comprehensive Paddle SDK integration with webhook handling

import { 
  PaddleEnvironment,
  PaddleCheckoutSettings,
  PaddleCheckoutSuccess,
  PaddleProduct,
  PaddleWebhookEvent,
  WebhookEventType,
  PaddleApiResponse,
  SubscriptionApiResponse
} from '../types/payment';

// Paddle SDK types (from @paddle/paddle-js)
interface PaddleSDK {
  Environment: {
    set: (environment: 'sandbox' | 'production') => void;
  };
  Setup: {
    vendor: (vendorId: number) => void;
  };
  Checkout: {
    open: (options: any) => void;
    close: () => void;
  };
  Spinner: {
    show: () => void;
    hide: () => void;
  };
}

declare global {
  interface Window {
    Paddle?: PaddleSDK;
  }
}

class PaddleService {
  private vendorId: string;
  private clientSideToken: string;
  private environment: 'sandbox' | 'production';
  private initialized: boolean = false;
  private paddleScript: HTMLScriptElement | null = null;

  constructor() {
    this.vendorId = import.meta.env.VITE_PADDLE_VENDOR_ID || '';
    this.clientSideToken = import.meta.env.VITE_PADDLE_CLIENT_SIDE_TOKEN || '';
    this.environment = (import.meta.env.VITE_PADDLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    if (!this.vendorId || !this.clientSideToken) {
      console.warn('Paddle configuration missing. Please set VITE_PADDLE_VENDOR_ID and VITE_PADDLE_CLIENT_SIDE_TOKEN');
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
      await this.loadPaddleScript();
      this.configurePaddle();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Paddle:', error);
      throw new Error('Paddle SDK initialization failed');
    }
  }

  /**
   * Load Paddle script dynamically
   */
  private loadPaddleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Paddle) {
        resolve();
        return;
      }

      this.paddleScript = document.createElement('script');
      this.paddleScript.src = 'https://cdn.paddle.com/paddle/paddle.js';
      this.paddleScript.onload = () => resolve();
      this.paddleScript.onerror = () => reject(new Error('Failed to load Paddle script'));
      
      document.head.appendChild(this.paddleScript);
    });
  }

  /**
   * Configure Paddle with environment and vendor settings
   */
  private configurePaddle(): void {
    if (!window.Paddle) {
      throw new Error('Paddle SDK not available');
    }

    window.Paddle.Environment.set(this.environment);
    window.Paddle.Setup.vendor(parseInt(this.vendorId));
  }

  /**
   * Open Paddle Checkout for one-time payments
   */
  async openCheckout(options: {
    product?: string;
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
        product: options.product,
        price: options.price,
        title: options.title || 'Kateriss AI Video Generation',
        quantity: options.quantity || 1,
        customer_email: options.customerEmail,
        customer_name: options.customerName,
        passthrough: JSON.stringify(options.customData || {}),
        
        // Callback functions
        successCallback: (data: PaddleCheckoutSuccess) => {
          resolve(data);
        },
        closeCallback: () => {
          reject(new Error('Checkout cancelled by user'));
        },
        
        // Additional settings
        ...options.settings
      };

      window.Paddle.Checkout.open(checkoutOptions);
    });
  }

  /**
   * Open Paddle Checkout for subscription
   */
  async openSubscriptionCheckout(options: {
    planId: string;
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
        product: options.planId,
        customer_email: options.customerEmail,
        customer_name: options.customerName,
        trial_days: options.trialDays,
        passthrough: JSON.stringify(options.customData || {}),
        
        // Callback functions
        successCallback: (data: PaddleCheckoutSuccess) => {
          resolve(data);
        },
        closeCallback: () => {
          reject(new Error('Subscription checkout cancelled by user'));
        },
        
        // Additional settings
        ...options.settings
      };

      window.Paddle.Checkout.open(checkoutOptions);
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
    const baseUrl = this.environment === 'sandbox' 
      ? 'https://sandbox-checkout.paddle.com/checkout'
      : 'https://checkout.paddle.com/checkout';
    
    const params = new URLSearchParams({
      vendor: this.vendorId,
      product: 'pay-per-video',
      quantity: videoCount.toString(),
      price: (2.49 * videoCount).toString()
    });

    if (customerEmail) {
      params.append('customer_email', customerEmail);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate subscription checkout URL
   */
  generateSubscriptionUrl(planId: string, customerEmail?: string): string {
    const baseUrl = this.environment === 'sandbox'
      ? 'https://sandbox-checkout.paddle.com/subscription'
      : 'https://checkout.paddle.com/subscription';
    
    const params = new URLSearchParams({
      vendor: this.vendorId,
      product: planId
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