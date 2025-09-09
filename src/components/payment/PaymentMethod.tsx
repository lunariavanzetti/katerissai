// Payment Method Component for Kateriss AI Video Generator
// Payment method management interface with brutalist design

import React, { useState } from 'react';
import clsx from 'clsx';
import { Button, Card, CardHeader, CardContent, CardFooter, Loading, Modal, ModalHeader, ModalContent, ModalFooter } from '../ui';
import { PaymentMethod as PaymentMethodType } from '../../types/payment';
import { useBilling } from '../../hooks/useBilling';

interface PaymentMethodProps {
  paymentMethods: PaymentMethodType[];
  onUpdate?: () => void;
  className?: string;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
  paymentMethods,
  onUpdate,
  className
}) => {
  const { 
    removePaymentMethod, 
    setDefaultPaymentMethod, 
    formatPaymentMethod, 
    loading 
  } = useBilling();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [processingMethodId, setProcessingMethodId] = useState<string | null>(null);

  const handleSetDefault = async (methodId: string) => {
    try {
      setProcessingMethodId(methodId);
      await setDefaultPaymentMethod(methodId);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to set default payment method:', error);
    } finally {
      setProcessingMethodId(null);
    }
  };

  const handleRemove = async (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method) return;

    if (method.isDefault && paymentMethods.length > 1) {
      alert('You cannot remove your default payment method. Please set another method as default first.');
      return;
    }

    if (window.confirm('Are you sure you want to remove this payment method?')) {
      try {
        setProcessingMethodId(methodId);
        await removePaymentMethod(methodId);
        onUpdate?.();
      } catch (error) {
        console.error('Failed to remove payment method:', error);
      } finally {
        setProcessingMethodId(null);
      }
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
            <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8H20V18ZM18 11H6V13H18V11Z"/>
          </svg>
        );
      case 'paypal':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.23c.07-.417.455-.714.884-.714h8.36c3.344 0 5.686 1.47 5.686 4.351 0 3.19-2.548 5.262-6.062 5.262H9.84l-.933 5.498a.641.641 0 0 1-.633.525zm6.24-12.65c1.684 0 3.062-.7 3.062-2.38 0-1.19-.826-1.91-2.548-1.91H10.85l-.723 4.29h3.189z"/>
          </svg>
        );
      case 'apple_pay':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        );
      case 'google_pay':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
            <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8H20V18ZM18 11H6V13H18V11Z"/>
          </svg>
        );
    }
  };

  return (
    <Card className={clsx('payment-methods border-3 border-black shadow-brutal', className)}>
      <CardHeader className="border-b-3 border-black">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold font-[Space_Grotesk] text-black uppercase">
            PAYMENT METHODS
          </h3>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="primary"
            size="sm"
            className="font-bold uppercase"
          >
            ADD METHOD
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {paymentMethods.length === 0 ? (
          <div className="empty-state p-12 text-center">
            <div className="w-16 h-16 bg-gray-200 border-3 border-black mx-auto mb-4 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-500 fill-current">
                <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8H20V18ZM18 11H6V13H18V11Z"/>
              </svg>
            </div>
            <h4 className="text-lg font-bold text-black mb-2">No Payment Methods</h4>
            <p className="text-gray-600 mb-4">
              Add a payment method to manage your subscriptions and purchases.
            </p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="primary"
              size="md"
              className="font-bold uppercase"
            >
              ADD PAYMENT METHOD
            </Button>
          </div>
        ) : (
          <div className="methods-list">
            {paymentMethods.map((method, index) => (
              <div
                key={method.id}
                className={clsx(
                  'method-card p-6 transition-all duration-200 hover:bg-gray-50',
                  index < paymentMethods.length - 1 && 'border-b-2 border-gray-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="method-info flex items-center gap-4">
                    {/* Method Icon */}
                    <div className={clsx(
                      'method-icon w-12 h-12 border-2 border-black flex items-center justify-center',
                      {
                        'bg-[#ff0080] text-white': method.isDefault,
                        'bg-gray-100 text-gray-600': !method.isDefault,
                      }
                    )}>
                      {getMethodIcon(method.type)}
                    </div>

                    {/* Method Details */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-black">
                          {formatPaymentMethod(method)}
                        </h4>
                        {method.isDefault && (
                          <div className="default-badge bg-[#00ff00] text-black px-2 py-1 text-xs font-bold uppercase border-2 border-black">
                            DEFAULT
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {method.type === 'card' && method.expiryMonth && method.expiryYear && (
                          <span>Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}</span>
                        )}
                        {method.type !== 'card' && (
                          <span>Added {method.createdAt.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Method Actions */}
                  <div className="method-actions flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        onClick={() => handleSetDefault(method.id)}
                        variant="outline"
                        size="sm"
                        loading={processingMethodId === method.id}
                        disabled={loading || processingMethodId !== null}
                        className="text-xs"
                      >
                        SET DEFAULT
                      </Button>
                    )}

                    <Button
                      onClick={() => handleRemove(method.id)}
                      variant="ghost"
                      size="sm"
                      loading={processingMethodId === method.id}
                      disabled={loading || processingMethodId !== null}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      REMOVE
                    </Button>
                  </div>
                </div>

                {/* Security Info */}
                {method.type === 'card' && (
                  <div className="security-info mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg width="12" height="12" viewBox="0 0 12 12" className="text-[#00ff00] fill-current">
                        <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z"/>
                      </svg>
                      <span>Securely stored and encrypted by Paddle</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          onUpdate?.();
        }}
      />
    </Card>
  );
};

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addPaymentMethod } = useBilling();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddPaymentMethod = async () => {
    try {
      setIsProcessing(true);
      
      // In a real implementation, this would integrate with Paddle's payment method collection
      // For now, we'll simulate the process
      const mockPaddleMethodId = `pm_${Date.now()}`;
      
      await addPaymentMethod(mockPaddleMethodId);
      onSuccess();
    } catch (error) {
      console.error('Failed to add payment method:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <h2 className="text-2xl font-bold font-[Space_Grotesk] text-black uppercase">
          ADD PAYMENT METHOD
        </h2>
        <p className="text-gray-600 mt-2">
          Add a new payment method to your account
        </p>
      </ModalHeader>

      <ModalContent>
        <div className="add-payment-content">
          <div className="notice p-4 border-2 border-[#ff0080] bg-pink-50 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#ff0080] border-2 border-black flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 16 16" className="text-white fill-current">
                  <path d="M8 1L15 15H1L8 1Z" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
                  <path d="M8 6v3M8 11h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-[#ff0080] mb-1">Secure Payment Processing</h4>
                <p className="text-sm text-gray-600">
                  Payment methods are securely processed and stored by Paddle. 
                  We never store your payment information on our servers.
                </p>
              </div>
            </div>
          </div>

          <div className="payment-options grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="option-card border-3 border-black p-4 hover:bg-gray-50 cursor-pointer transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gray-100 border-2 border-black flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-600 fill-current">
                    <path d="M17 3H3C1.9 3 1 3.9 1 5V15C1 16.1 1.9 17 3 17H17C18.1 17 19 16.1 19 15V5C19 3.9 18.1 3 17 3ZM17 15H3V7H17V15ZM15 9H5V11H15V9Z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-black">Credit/Debit Card</h4>
              </div>
              <p className="text-sm text-gray-600">
                Add Visa, Mastercard, American Express, or other major cards
              </p>
            </div>

            <div className="option-card border-3 border-black p-4 hover:bg-gray-50 cursor-pointer transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 border-2 border-black flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" className="text-blue-600 fill-current">
                    <path d="M5.076 17.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.23c.07-.417.455-.714.884-.714h8.36c3.344 0 5.686 1.47 5.686 4.351 0 3.19-2.548 5.262-6.062 5.262H9.84l-.933 5.498a.641.641 0 0 1-.633.525zm6.24-12.65c1.684 0 3.062-.7 3.062-2.38 0-1.19-.826-1.91-2.548-1.91H10.85l-.723 4.29h3.189z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-black">PayPal</h4>
              </div>
              <p className="text-sm text-gray-600">
                Use your existing PayPal account for secure payments
              </p>
            </div>
          </div>

          <div className="disclaimer mt-6 text-xs text-gray-500 text-center">
            By adding a payment method, you agree to our Terms of Service and Privacy Policy. 
            All payments are processed securely through Paddle.
          </div>
        </div>
      </ModalContent>

      <ModalFooter>
        <div className="flex gap-3 w-full">
          <Button
            onClick={onClose}
            variant="outline"
            size="md"
            disabled={isProcessing}
          >
            CANCEL
          </Button>
          
          <Button
            onClick={handleAddPaymentMethod}
            variant="primary"
            size="md"
            fullWidth
            loading={isProcessing}
            disabled={isProcessing}
            className="font-bold uppercase"
          >
            CONTINUE WITH PADDLE
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default PaymentMethod;