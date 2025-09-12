// Upgrade Modal Component for Kateriss AI Video Generator
// Plan upgrade flow with Paddle integration and brutalist design

import React, { useState } from 'react';
import clsx from 'clsx';
import { Button, Modal, ModalHeader, ModalContent, ModalFooter, Loading } from '../ui';
import { 
  UpgradeModalProps,
  PricingPlan,
  DEFAULT_PRICING_PLANS
} from '../../types/payment';
import { usePayment } from '../../hooks/usePayment';
import { useSubscription } from '../../hooks/useSubscription';
import { PricingCards } from './PricingCards';

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  targetPlan,
  onUpgrade,
  onError
}) => {
  const { initiateCheckout, validatePayment, formatPrice } = usePayment();
  const { subscription, updateSubscription } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(
    targetPlan ? DEFAULT_PRICING_PLANS.find(p => p.tier === targetPlan) || null : null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm' | 'processing'>('select');

  // Filter plans to show only upgrades
  const availablePlans = DEFAULT_PRICING_PLANS.filter(plan => {
    if (!currentPlan) return true;
    
    const planPriority = {
      'pay-per-video': 0,
      'basic': 1,
      'premium': 2
    };
    
    return planPriority[plan.tier] > planPriority[currentPlan];
  });

  const currentPlanData = currentPlan ? DEFAULT_PRICING_PLANS.find(p => p.tier === currentPlan) : null;

  const handlePlanSelect = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setStep('confirm');
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) {
      console.error('❌ No plan selected');
      return;
    }

    console.log('🚀 Confirming upgrade for plan:', selectedPlan.tier);

    try {
      setIsProcessing(true);
      setStep('processing');

      // Validate the payment
      const validation = validatePayment(selectedPlan);
      if (!validation.isValid) {
        console.error('❌ Payment validation failed:', validation.error);
        throw new Error(validation.error);
      }
      
      console.log('✅ Payment validation passed');

      if (subscription) {
        // Update existing subscription
        await updateSubscription(selectedPlan.tier);
        onUpgrade(selectedPlan);
        onClose();
      } else {
        // Create new subscription via checkout
        console.log('💳 Starting checkout for new subscription...');
        console.log('💳 Plan details:', { 
          tier: selectedPlan.tier, 
          price: selectedPlan.price, 
          paddleProductId: selectedPlan.paddleProductId 
        });
        
        await initiateCheckout(selectedPlan, {
          successCallback: (data) => {
            console.log('✅ Checkout success:', data);
            onUpgrade(selectedPlan);
            onClose();
          },
          closeCallback: () => {
            console.log('❌ Checkout closed by user');
            setStep('confirm');
            setIsProcessing(false);
          }
        });
        
        console.log('💳 Checkout initiated successfully');
      }
    } catch (error) {
      console.error('❌ Upgrade failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upgrade failed';
      console.error('❌ Error message:', errorMessage);
      onError?.(errorMessage);
      setStep('confirm');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('select');
      setSelectedPlan(targetPlan ? DEFAULT_PRICING_PLANS.find(p => p.tier === targetPlan) || null : null);
    }
  };

  const renderPlanSelection = () => (
    <>
      <ModalHeader>
        <h2 className="text-2xl font-bold font-[Space_Grotesk] text-black uppercase">
          UPGRADE YOUR PLAN
        </h2>
        <p className="text-gray-600 mt-2">
          {currentPlan 
            ? `Upgrade from ${currentPlanData?.name} to unlock more features`
            : 'Choose a plan to get started'
          }
        </p>
      </ModalHeader>

      <ModalContent>
        {currentPlan && (
          <div className="current-plan mb-6 p-4 border-2 border-gray-300 bg-gray-50">
            <h3 className="font-bold text-black mb-2">Current Plan</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">{currentPlanData?.name}</span>
              <span className="font-bold text-gray-900">
                {currentPlanData?.price === 0 ? 'Free' : formatPrice(currentPlanData?.price || 0)}
                {currentPlanData?.interval !== 'one-time' && `/${currentPlanData?.interval}`}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {availablePlans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handlePlanSelect(plan)}
              className={clsx(
                'plan-option p-4 border-3 border-black cursor-pointer transition-all duration-200',
                'hover:shadow-brutal-hover hover:transform hover:translate-x-[-2px] hover:translate-y-[-2px]',
                {
                  'bg-gradient-to-br from-[#ff0080] to-[#ff69b4] text-white border-[#ff0080]': plan.tier === 'premium',
                  'bg-white text-black': plan.tier !== 'premium',
                }
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className={clsx(
                    'text-lg font-bold font-[Space_Grotesk] uppercase',
                    plan.tier === 'premium' ? 'text-white' : 'text-black'
                  )}>
                    {plan.name}
                  </h3>
                  <p className={clsx(
                    'text-sm',
                    plan.tier === 'premium' ? 'text-pink-100' : 'text-gray-600'
                  )}>
                    {plan.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className={clsx(
                    'text-2xl font-bold font-[Space_Grotesk]',
                    plan.tier === 'premium' ? 'text-white' : 'text-black'
                  )}>
                    {formatPrice(plan.price)}
                  </div>
                  {plan.interval !== 'one-time' && (
                    <div className={clsx(
                      'text-sm',
                      plan.tier === 'premium' ? 'text-pink-100' : 'text-gray-500'
                    )}>
                      per {plan.interval}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={clsx(
                    'text-xs uppercase tracking-wide mb-1',
                    plan.tier === 'premium' ? 'text-pink-100' : 'text-gray-500'
                  )}>
                    Videos
                  </div>
                  <div className={clsx(
                    'font-bold',
                    plan.tier === 'premium' ? 'text-white' : 'text-black'
                  )}>
                    {plan.videoLimit || 'Unlimited'}
                  </div>
                </div>
                
                <div>
                  <div className={clsx(
                    'text-xs uppercase tracking-wide mb-1',
                    plan.tier === 'premium' ? 'text-pink-100' : 'text-gray-500'
                  )}>
                    Commercial Rights
                  </div>
                  <div className={clsx(
                    'font-bold',
                    plan.tier === 'premium' ? 'text-white' : 'text-black'
                  )}>
                    {plan.commercialRights ? 'Included' : 'Not included'}
                  </div>
                </div>
              </div>

              {plan.popular && (
                <div className="mt-3 pt-3 border-t border-dashed border-pink-200">
                  <div className="flex items-center justify-center gap-2 text-white">
                    <svg width="16" height="16" viewBox="0 0 16 16" className="fill-current">
                      <path d="M8 0L10 6H16L11 10L13 16L8 12L3 16L5 10L0 6H6L8 0Z"/>
                    </svg>
                    <span className="text-sm font-bold uppercase">MOST POPULAR</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ModalContent>

      <ModalFooter>
        <Button
          onClick={onClose}
          variant="ghost"
          size="md"
        >
          Cancel
        </Button>
      </ModalFooter>
    </>
  );

  const renderConfirmation = () => (
    <>
      <ModalHeader>
        <h2 className="text-2xl font-bold font-[Space_Grotesk] text-black uppercase">
          CONFIRM UPGRADE
        </h2>
        <p className="text-gray-600 mt-2">
          Review your upgrade and confirm the changes
        </p>
      </ModalHeader>

      <ModalContent>
        {selectedPlan && (
          <div className="upgrade-summary">
            {/* Plan Comparison */}
            <div className="comparison mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Plan */}
                {currentPlanData && (
                  <div className="current-plan border-2 border-gray-300 p-4">
                    <h3 className="font-bold text-gray-600 mb-2 uppercase text-sm">Current Plan</h3>
                    <div className="text-lg font-bold text-black">{currentPlanData.name}</div>
                    <div className="text-gray-600">
                      {formatPrice(currentPlanData.price)}
                      {currentPlanData.interval !== 'one-time' && `/${currentPlanData.interval}`}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {currentPlanData.videoLimit || 'Unlimited'} videos
                    </div>
                  </div>
                )}

                {/* New Plan */}
                <div className={clsx(
                  'new-plan border-3 p-4',
                  selectedPlan.tier === 'premium' 
                    ? 'border-[#ff0080] bg-gradient-to-br from-[#ff0080] to-[#ff69b4] text-white'
                    : 'border-black bg-white text-black'
                )}>
                  <h3 className={clsx(
                    'font-bold mb-2 uppercase text-sm',
                    selectedPlan.tier === 'premium' ? 'text-pink-100' : 'text-gray-600'
                  )}>
                    New Plan
                  </h3>
                  <div className={clsx(
                    'text-lg font-bold',
                    selectedPlan.tier === 'premium' ? 'text-white' : 'text-black'
                  )}>
                    {selectedPlan.name}
                  </div>
                  <div className={clsx(
                    selectedPlan.tier === 'premium' ? 'text-pink-100' : 'text-gray-600'
                  )}>
                    {formatPrice(selectedPlan.price)}
                    {selectedPlan.interval !== 'one-time' && `/${selectedPlan.interval}`}
                  </div>
                  <div className={clsx(
                    'text-sm mt-2',
                    selectedPlan.tier === 'premium' ? 'text-pink-100' : 'text-gray-500'
                  )}>
                    {selectedPlan.videoLimit || 'Unlimited'} videos
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="benefits mb-6 p-4 border-2 border-[#00ff00] bg-green-50">
              <h3 className="font-bold text-black mb-3">What you get with this upgrade:</h3>
              <ul className="space-y-2">
                {selectedPlan.features.slice(0, 4).map((feature, index) => (
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

            {/* Billing Info */}
            <div className="billing-info p-4 border-2 border-black bg-gray-50">
              <h3 className="font-bold text-black mb-2">Billing Information</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  <strong>Amount:</strong> {formatPrice(selectedPlan.price)}
                  {selectedPlan.interval !== 'one-time' && ` per ${selectedPlan.interval}`}
                </div>
                {subscription && (
                  <div>
                    <strong>Billing:</strong> Changes will be prorated on your next invoice
                  </div>
                )}
                <div>
                  <strong>Cancellation:</strong> Cancel anytime, no questions asked
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalContent>

      <ModalFooter>
        <div className="flex gap-3 w-full">
          <Button
            onClick={handleBack}
            variant="outline"
            size="md"
            disabled={isProcessing}
          >
            BACK
          </Button>
          
          <Button
            onClick={handleConfirmUpgrade}
            variant="primary"
            size="md"
            fullWidth
            loading={isProcessing}
            disabled={isProcessing}
            className="font-bold uppercase"
          >
            {subscription ? 'UPGRADE NOW' : 'PROCEED TO PAYMENT'}
          </Button>
        </div>
      </ModalFooter>
    </>
  );

  const renderProcessing = () => (
    <>
      <ModalHeader>
        <h2 className="text-2xl font-bold font-[Space_Grotesk] text-black uppercase">
          PROCESSING UPGRADE
        </h2>
      </ModalHeader>

      <ModalContent>
        <div className="text-center py-8">
          <Loading size="lg" className="mb-4" />
          <p className="text-gray-600">
            {subscription 
              ? 'Updating your subscription...'
              : 'Please complete your payment in the secure checkout window...'
            }
          </p>
        </div>
      </ModalContent>
    </>
  );

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={isProcessing ? undefined : onClose}
      className="max-w-4xl"
    >
      {step === 'select' && renderPlanSelection()}
      {step === 'confirm' && renderConfirmation()}
      {step === 'processing' && renderProcessing()}
    </Modal>
  );
};

export default UpgradeModal;