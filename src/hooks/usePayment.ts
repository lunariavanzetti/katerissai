// Payment Processing Hook for Kateriss AI Video Generator
// React hook for Paddle Checkout integration

import { useState, useCallback } from 'react';
import { 
  Payment,
  PricingPlan,
  UsePaymentReturn,
  PaddleCheckoutSettings,
  PaddleCheckoutSuccess
} from '../types/payment';
import { paddleService } from '../services/paddle';
import { useAuthContext } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { config } from '../config/env';

export const usePayment = (): UsePaymentReturn => {
  const { user } = useAuthContext();
  const showToast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiate Paddle Checkout for a plan
   */
  const initiateCheckout = useCallback(async (
    plan: PricingPlan,
    options?: PaddleCheckoutSettings
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to make payments');
    }

    try {
      setLoading(true);
      setError(null);

      // Show loading toast
      showToast.info('Redirecting to secure payment...', {
        title: 'Opening Checkout'
      });

      const checkoutOptions = {
        ...options,
        successCallback: (data: PaddleCheckoutSuccess) => {
          setLoading(false);
          showToast.success(`Successfully purchased ${plan.name}`, {
            title: 'Payment Successful!'
          });
          
          // Call original success callback if provided
          options?.successCallback?.(data);
        },
        closeCallback: () => {
          setLoading(false);
          showToast.info('Payment process was cancelled', {
            title: 'Checkout Closed'
          });
          
          // Call original close callback if provided
          options?.closeCallback?.();
        }
      };

      if (plan.interval === 'one-time') {
        // One-time payment (pay-per-video)
        await paddleService.openCheckout({
          priceId: plan.paddleProductId,
          title: plan.name,
          quantity: 1,
          customerEmail: user.email,
          customerName: user.user_metadata?.full_name || user.email,
          customData: {
            userId: user.id,
            plan: plan.tier,
            type: 'one-time'
          },
          settings: checkoutOptions
        });
      } else {
        // Subscription payment
        if (!plan.paddleProductId) {
          throw new Error('Plan does not have a Paddle product ID configured');
        }

        await paddleService.openSubscriptionCheckout({
          priceId: plan.paddleProductId,
          customerEmail: user.email,
          customerName: user.user_metadata?.full_name || user.email,
          customData: {
            userId: user.id,
            plan: plan.tier,
            type: 'subscription'
          },
          settings: checkoutOptions
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate checkout';
      setError(errorMessage);
      setLoading(false);
      
      showToast.error(errorMessage, {
        title: 'Checkout Failed'
      });
      
      throw err;
    }
  }, [user, showToast]);

  /**
   * Process one-time payment (pay-per-video)
   */
  const processOneTimePayment = useCallback(async (
    amount: number,
    description: string
  ): Promise<Payment> => {
    if (!user) {
      throw new Error('User must be authenticated to make payments');
    }

    try {
      setLoading(true);
      setError(null);

      const checkoutData = await paddleService.openCheckout({
        priceId: config.paddle.priceIds.payPerVideo,
        title: description,
        quantity: 1,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email,
        customData: {
          userId: user.id,
          type: 'one-time',
          description
        }
      });

      // Create payment record
      const payment: Payment = {
        id: `payment_${Date.now()}`,
        userId: user.id,
        paddleOrderId: checkoutData.order.id,
        amount: parseFloat(checkoutData.order.total),
        currency: checkoutData.order.currency,
        status: 'completed',
        type: 'one-time',
        description,
        createdAt: new Date(),
        paidAt: new Date()
      };

      showToast.success(`Paid ${paddleService.formatPrice(amount)} for ${description}`, {
        title: 'Payment Successful!'
      });

      return payment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      setError(errorMessage);
      
      showToast.error(errorMessage, {
        title: 'Payment Failed'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  /**
   * Refund a payment
   */
  const refundPayment = useCallback(async (
    paymentId: string,
    amount?: number
  ): Promise<Payment> => {
    try {
      setLoading(true);
      setError(null);

      // Get payment details first
      const paymentData = await paddleService.getPayment(paymentId);
      
      if (!paymentData) {
        throw new Error('Payment not found');
      }

      // Process refund with Paddle
      const refundResponse = await paddleService.refundPayment(
        paymentData.paddle_order_id,
        amount,
        'Customer requested refund'
      );

      if (!refundResponse.success) {
        throw new Error(refundResponse.error?.message || 'Refund failed');
      }

      // Update payment record
      const refundedPayment: Payment = {
        ...paymentData,
        status: amount && amount < paymentData.amount ? 'partially_refunded' : 'refunded',
        refundedAt: new Date()
      };

      const refundAmount = amount || paymentData.amount;
      showToast.success(`Refunded ${paddleService.formatPrice(refundAmount)}`, {
        title: 'Refund Processed'
      });

      return refundedPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process refund';
      setError(errorMessage);
      
      showToast.error(errorMessage, {
        title: 'Refund Failed'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Get payment history
   */
  const getPaymentHistory = useCallback(async (): Promise<Payment[]> => {
    if (!user) {
      throw new Error('User must be authenticated to view payment history');
    }

    try {
      setLoading(true);
      setError(null);

      // This would typically fetch from your backend API
      // For now, return mock data
      const payments: Payment[] = [];

      return payments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment history';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Check payment status
   */
  const checkPaymentStatus = useCallback(async (orderId: string): Promise<Payment | null> => {
    try {
      setLoading(true);
      setError(null);

      const paymentData = await paddleService.getPayment(orderId);
      return paymentData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check payment status';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate payment URL for external use
   */
  const generatePaymentUrl = useCallback((plan: PricingPlan, customerEmail?: string): string => {
    if (plan.interval === 'one-time') {
      return paddleService.generatePayPerVideoUrl(1, customerEmail);
    } else {
      if (!plan.paddleProductId) {
        throw new Error('Plan does not have a Paddle product ID configured');
      }
      return paddleService.generateSubscriptionUrl(plan.paddleProductId, customerEmail);
    }
  }, []);

  /**
   * Cancel ongoing checkout
   */
  const cancelCheckout = useCallback(() => {
    paddleService.closeCheckout();
    setLoading(false);
    setError(null);
    
    showToast.info('Payment process was cancelled', {
      title: 'Checkout Cancelled'
    });
  }, [showToast]);

  /**
   * Validate payment before processing
   */
  const validatePayment = useCallback((plan: PricingPlan): { isValid: boolean; error?: string } => {
    if (!user) {
      return { isValid: false, error: 'User must be authenticated' };
    }

    if (!paddleService.isConfigured()) {
      return { isValid: false, error: 'Paddle is not properly configured' };
    }

    if (plan.interval !== 'one-time' && !plan.paddleProductId) {
      return { isValid: false, error: 'Subscription plan missing Paddle product ID' };
    }

    if (plan.price <= 0) {
      return { isValid: false, error: 'Invalid plan price' };
    }

    return { isValid: true };
  }, [user]);

  /**
   * Format price for display
   */
  const formatPrice = useCallback((amount: number, currency: string = 'USD'): string => {
    return paddleService.formatPrice(amount, currency);
  }, []);

  return {
    loading,
    error,
    actions: {
      initiateCheckout,
      processOneTimePayment,
      refundPayment,
      getPaymentHistory
    },
    // Additional utility methods
    checkPaymentStatus,
    generatePaymentUrl,
    cancelCheckout,
    validatePayment,
    formatPrice
  } as UsePaymentReturn & {
    checkPaymentStatus: (orderId: string) => Promise<Payment | null>;
    generatePaymentUrl: (plan: PricingPlan, customerEmail?: string) => string;
    cancelCheckout: () => void;
    validatePayment: (plan: PricingPlan) => { isValid: boolean; error?: string };
    formatPrice: (amount: number, currency?: string) => string;
  };
};