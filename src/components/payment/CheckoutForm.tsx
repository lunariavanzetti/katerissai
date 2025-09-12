// Checkout Form Component for Kateriss AI Video Generator
// Paddle Checkout with brutalist styling and pink accents

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Button, Card, CardHeader, CardContent, CardFooter, Loading } from '../ui';
import { 
  PricingPlan,
  CheckoutFormProps,
  PaddleCheckoutSuccess
} from '../../types/payment';
import { usePayment } from '../../hooks/usePayment';
import { useAuthContext } from '../../contexts/AuthContext';

interface CheckoutFormState {
  step: 'plan' | 'payment' | 'processing' | 'success' | 'error';
  error?: string;
  checkoutData?: PaddleCheckoutSuccess;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  plan,
  onSuccess,
  onError,
  onCancel,
  customAmount,
  videoCount = 1,
  className
}) => {
  const { user } = useAuthContext();
  const { initiateCheckout, validatePayment, loading, formatPrice } = usePayment();
  
  const [state, setState] = useState<CheckoutFormState>({ step: 'plan' });
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate final amount for pay-per-video
  const finalAmount = customAmount || (plan.tier === 'pay-per-video' ? plan.price * videoCount : plan.price);

  useEffect(() => {
    // Validate payment on mount
    const validation = validatePayment(plan);
    if (!validation.isValid) {
      setState({ step: 'error', error: validation.error });
    }
  }, [plan, validatePayment]);

  const handleProceedToPayment = async () => {
    try {
      setState({ step: 'processing' });
      setIsProcessing(true);

      await initiateCheckout(plan, {
        successCallback: (data: PaddleCheckoutSuccess) => {
          setState({ step: 'success', checkoutData: data });
          onSuccess(data);
        },
        closeCallback: () => {
          if (state.step === 'processing') {
            setState({ step: 'plan' });
            setIsProcessing(false);
            onCancel?.();
          }
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setState({ step: 'error', error: errorMessage });
      onError(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setState({ step: 'plan' });
  };

  const handleCancel = () => {
    setState({ step: 'plan' });
    onCancel?.();
  };

  const renderPlanReview = () => (
    <Card className={clsx(
      'checkout-form bg-white border-3 border-black shadow-brutal',
      className
    )}>
      <CardHeader className="text-center border-b-3 border-black">
        <h2 className="text-2xl font-bold font-[Space_Grotesk] text-black uppercase">
          CHECKOUT
        </h2>
        <p className="text-gray-600 mt-2">
          Review your order and proceed to payment
        </p>
      </CardHeader>

      <CardContent className="p-6">
        {/* Plan Summary */}
        <div className="plan-summary mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-[Space_Grotesk] text-black">
              {plan.name}
            </h3>
            {plan.highlighted && (
              <div className="bg-[#ff0080] text-white px-2 py-1 text-xs font-bold uppercase border-2 border-black">
                PREMIUM
              </div>
            )}
          </div>
          
          <p className="text-gray-600 mb-4">{plan.description}</p>
          
          {/* Features List */}
          <div className="features-list mb-4">
            <h4 className="font-bold text-black mb-2">What's included:</h4>
            <ul className="space-y-2">
              {plan.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#00ff00] border-2 border-black flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" className="text-black fill-current">
                      <path d="M8 2L3.5 6.5L1.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary border-3 border-black p-4 bg-gray-50">
          <h4 className="font-bold font-[Space_Grotesk] text-black mb-3 uppercase">
            Order Summary
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium text-black">{plan.name}</span>
            </div>
            
            {plan.tier === 'pay-per-video' && videoCount > 1 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Videos:</span>
                <span className="font-medium text-black">{videoCount}</span>
              </div>
            )}
            
            {plan.interval !== 'one-time' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Billing:</span>
                <span className="font-medium text-black">Monthly</span>
              </div>
            )}
            
            <hr className="border-black border-1" />
            
            <div className="flex justify-between text-lg font-bold">
              <span className="text-black">Total:</span>
              <span className="text-[#ff0080]">{formatPrice(finalAmount)}</span>
            </div>
            
            {plan.interval !== 'one-time' && (
              <div className="text-xs text-gray-500 text-right">
                Billed monthly, cancel anytime
              </div>
            )}
          </div>
        </div>

        {/* Customer Info */}
        {user && (
          <div className="customer-info mt-4 p-4 border-2 border-dashed border-gray-300">
            <h4 className="font-bold text-black mb-2">Customer Information:</h4>
            <div className="text-sm text-gray-600">
              <div>Email: {user.email}</div>
              {user.user_metadata?.full_name && (
                <div>Name: {user.user_metadata.full_name}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t-3 border-black p-6">
        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={handleProceedToPayment}
            variant="primary"
            size="lg"
            fullWidth
            loading={isProcessing}
            disabled={isProcessing}
            className="font-bold uppercase tracking-wide"
          >
            PROCEED TO PAYMENT
          </Button>
          
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="md"
            fullWidth
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-4 text-xs text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-[#00ff00] fill-current">
              <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z"/>
            </svg>
            <span>Secure payment powered by Paddle</span>
          </div>
          <div>256-bit SSL encryption • PCI DSS compliant</div>
        </div>
      </CardFooter>
    </Card>
  );

  const renderProcessing = () => (
    <Card className="checkout-form bg-white border-3 border-black shadow-brutal text-center">
      <CardContent className="p-12">
        <Loading size="lg" className="mb-4" />
        <h3 className="text-xl font-bold font-[Space_Grotesk] text-black mb-2">
          PROCESSING PAYMENT
        </h3>
        <p className="text-gray-600">
          Please complete your payment in the secure checkout window...
        </p>
        <div className="mt-6">
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSuccess = () => (
    <Card className="checkout-form bg-white border-3 border-black shadow-brutal text-center">
      <CardContent className="p-12">
        <div className="w-16 h-16 bg-[#00ff00] border-3 border-black mx-auto mb-4 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-black fill-current">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold font-[Space_Grotesk] text-black mb-2">
          PAYMENT SUCCESSFUL!
        </h3>
        
        <p className="text-gray-600 mb-6">
          Thank you for your purchase of {plan.name}!
        </p>
        
        {state.checkoutData && (
          <div className="bg-gray-50 border-2 border-black p-4 text-left mb-6">
            <div className="text-sm space-y-1">
              <div><strong>Order ID:</strong> {state.checkoutData.order.id}</div>
              <div><strong>Amount:</strong> {state.checkoutData.order.formatted_total}</div>
              <div><strong>Status:</strong> Completed</div>
            </div>
          </div>
        )}
        
        <p className="text-sm text-gray-500">
          You should receive a confirmation email shortly.
        </p>
      </CardContent>
    </Card>
  );

  const renderError = () => (
    <Card className="checkout-form bg-white border-3 border-black shadow-brutal text-center">
      <CardContent className="p-12">
        <div className="w-16 h-16 bg-red-500 border-3 border-black mx-auto mb-4 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-white fill-current">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold font-[Space_Grotesk] text-black mb-2">
          PAYMENT FAILED
        </h3>
        
        <p className="text-gray-600 mb-6">
          {state.error || 'Something went wrong with your payment.'}
        </p>
        
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleRetry}
            variant="primary"
            size="md"
          >
            TRY AGAIN
          </Button>
          
          <Button
            onClick={handleCancel}
            variant="outline"
            size="md"
          >
            CANCEL
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render appropriate step
  switch (state.step) {
    case 'processing':
      return renderProcessing();
    case 'success':
      return renderSuccess();
    case 'error':
      return renderError();
    case 'plan':
    default:
      return renderPlanReview();
  }
};

export default CheckoutForm;