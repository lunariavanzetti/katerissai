// Pricing Cards Component for Kateriss AI Video Generator
// 3-tier pricing display with Premium highlighted in pink

import React from 'react';
import clsx from 'clsx';
import { Button, Card, CardHeader, CardContent, CardFooter } from '../ui';
import { 
  PricingPlan, 
  PricingCardProps,
  DEFAULT_PRICING_PLANS 
} from '../../types/payment';
import { usePayment } from '../../hooks/usePayment';
import { useSubscription } from '../../hooks/useSubscription';

interface PricingCardsProps {
  plans?: PricingPlan[];
  onPlanSelect?: (plan: PricingPlan) => void;
  showCurrentPlan?: boolean;
  className?: string;
}

export const PricingCards: React.FC<PricingCardsProps> = ({
  plans = DEFAULT_PRICING_PLANS,
  onPlanSelect,
  showCurrentPlan = true,
  className
}) => {
  const { initiateCheckout, validatePayment, loading } = usePayment();
  const { subscription } = useSubscription();

  const handlePlanSelect = async (plan: PricingPlan) => {
    try {
      if (onPlanSelect) {
        onPlanSelect(plan);
      } else {
        // Validate payment before proceeding
        const validation = validatePayment(plan);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        // Initiate checkout
        await initiateCheckout(plan);
      }
    } catch (error) {
      console.error('Failed to select plan:', error);
    }
  };

  return (
    <div className={clsx('pricing-cards-container', className)}>
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold font-[Space_Grotesk] text-black mb-4">
          CHOOSE YOUR PLAN
        </h2>
        <p className="text-lg text-gray-800 max-w-2xl mx-auto">
          Generate stunning AI videos with our flexible pricing options. 
          Start free or go premium for unlimited creation.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentPlan={subscription?.plan}
            onSelect={handlePlanSelect}
            loading={loading}
            disabled={loading}
          />
        ))}
      </div>

      {/* Trust Indicators */}
      <div className="text-center mt-12 pt-8 border-t-3 border-black">
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#00ff00] border-2 border-black"></div>
            <span>30-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#00ff00] border-2 border-black"></div>
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#00ff00] border-2 border-black"></div>
            <span>Secure payment via Paddle</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  currentPlan,
  onSelect,
  loading = false,
  disabled = false,
  className
}) => {
  const isCurrentPlan = currentPlan === plan.tier;
  const isPremium = plan.tier === 'premium';
  const isPopular = plan.popular || isPremium;

  return (
    <Card
      className={clsx(
        'pricing-card relative',
        'transition-all duration-300 ease-in-out',
        'hover:transform hover:translate-y-[-4px]',
        {
          // Premium plan styling with pink gradient
          'bg-gradient-to-br from-[#ff0080] to-[#ff69b4] text-white border-[#ff0080]': isPremium,
          'shadow-[8px_8px_0px_#ff0080] hover:shadow-[12px_12px_0px_#ff0080]': isPremium,
          
          // Regular plan styling
          'bg-white text-black border-black shadow-brutal hover:shadow-brutal-hover': !isPremium,
          
          // Current plan styling
          'ring-4 ring-[#00ff00] ring-offset-2': isCurrentPlan,
          
          // Disabled styling
          'opacity-60 cursor-not-allowed': disabled,
        },
        className
      )}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-[#00ff00] text-black px-4 py-2 text-xs font-bold uppercase tracking-wide border-3 border-black shadow-brutal">
            {isPremium ? 'MOST POPULAR' : 'POPULAR'}
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-4 -right-4">
          <div className="bg-[#00ff00] text-black px-3 py-1 text-xs font-bold uppercase tracking-wide border-3 border-black shadow-brutal rotate-12">
            CURRENT
          </div>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="mb-4">
          <h3 className={clsx(
            'text-2xl font-bold font-[Space_Grotesk] uppercase',
            isPremium ? 'text-white' : 'text-black'
          )}>
            {plan.name}
          </h3>
          <p className={clsx(
            'text-sm mt-2',
            isPremium ? 'text-pink-100' : 'text-gray-600'
          )}>
            {plan.description}
          </p>
        </div>

        {/* Pricing */}
        <div className="pricing-display">
          <div className="flex items-center justify-center">
            <span className={clsx(
              'text-4xl font-bold font-[Space_Grotesk]',
              isPremium ? 'text-white' : 'text-black'
            )}>
              ${plan.price}
            </span>
            {plan.interval !== 'one-time' && (
              <span className={clsx(
                'text-lg ml-1',
                isPremium ? 'text-pink-100' : 'text-gray-600'
              )}>
                /{plan.interval}
              </span>
            )}
          </div>
          
          {plan.interval === 'one-time' && (
            <div className={clsx(
              'text-sm mt-1',
              isPremium ? 'text-pink-100' : 'text-gray-500'
            )}>
              per video
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-6">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className={clsx(
                'w-5 h-5 mt-0.5 border-2 flex items-center justify-center flex-shrink-0',
                isPremium 
                  ? 'bg-white border-white text-[#ff0080]' 
                  : 'bg-[#00ff00] border-black text-black'
              )}>
                <svg width="12" height="12" viewBox="0 0 12 12" className="fill-current">
                  <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className={clsx(
                'text-sm font-medium',
                isPremium ? 'text-white' : 'text-gray-700'
              )}>
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* Usage Limit Display */}
        {plan.videoLimit && (
          <div className={clsx(
            'mt-4 p-3 border-2 border-dashed',
            isPremium 
              ? 'border-pink-200 bg-pink-100/10' 
              : 'border-gray-300 bg-gray-50'
          )}>
            <div className="text-center">
              <div className={clsx(
                'text-2xl font-bold font-[Space_Grotesk]',
                isPremium ? 'text-white' : 'text-black'
              )}>
                {plan.videoLimit}
              </div>
              <div className={clsx(
                'text-xs uppercase tracking-wide',
                isPremium ? 'text-pink-100' : 'text-gray-500'
              )}>
                videos per month
              </div>
            </div>
          </div>
        )}

        {/* Unlimited Display */}
        {!plan.videoLimit && plan.tier !== 'pay-per-video' && (
          <div className={clsx(
            'mt-4 p-3 border-2',
            isPremium 
              ? 'border-white bg-white/10' 
              : 'border-[#00ff00] bg-[#00ff00]/10'
          )}>
            <div className="text-center">
              <div className={clsx(
                'text-xl font-bold font-[Space_Grotesk]',
                isPremium ? 'text-white' : 'text-black'
              )}>
                ∞ UNLIMITED
              </div>
              <div className={clsx(
                'text-xs uppercase tracking-wide',
                isPremium ? 'text-pink-100' : 'text-gray-600'
              )}>
                videos per month
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          onClick={() => !disabled && onSelect(plan)}
          variant={isPremium ? 'secondary' : plan.buttonVariant}
          size="lg"
          fullWidth
          loading={loading}
          disabled={disabled || isCurrentPlan}
          className={clsx(
            'font-bold uppercase tracking-wide',
            {
              // Premium button styling
              'bg-white text-[#ff0080] border-white hover:bg-gray-100': isPremium,
              'shadow-[4px_4px_0px_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_0px_rgba(255,255,255,0.3)]': isPremium,
            }
          )}
        >
          {isCurrentPlan ? 'CURRENT PLAN' : plan.buttonText}
        </Button>

        {/* Money Back Guarantee */}
        {plan.tier !== 'pay-per-video' && (
          <div className="text-center mt-3">
            <span className={clsx(
              'text-xs',
              isPremium ? 'text-pink-100' : 'text-gray-500'
            )}>
              30-day money-back guarantee
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PricingCards;