// Plan Comparison Component for Kateriss AI Video Generator
// Detailed feature comparison table with brutalist design

import React, { useState } from 'react';
import clsx from 'clsx';
import { Button, Card, CardHeader, CardContent } from '../ui';
import { 
  PlanComparisonProps,
  PricingPlan,
  PricingFeature,
  DEFAULT_PRICING_PLANS,
  DEFAULT_PRICING_FEATURES
} from '../../types/payment';

export const PlanComparison: React.FC<PlanComparisonProps> = ({
  plans = DEFAULT_PRICING_PLANS,
  features = DEFAULT_PRICING_FEATURES,
  currentPlan,
  onPlanSelect,
  className
}) => {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const formatPrice = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  const renderFeatureValue = (feature: PricingFeature, planTier: string) => {
    const value = feature.included[planTier as keyof typeof feature.included];
    
    if (typeof value === 'boolean') {
      return value ? (
        <div className="w-6 h-6 bg-[#00ff00] border-2 border-black flex items-center justify-center mx-auto">
          <svg width="16" height="16" viewBox="0 0 16 16" className="text-black fill-current">
            <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ) : (
        <div className="w-6 h-6 bg-red-500 border-2 border-black flex items-center justify-center mx-auto">
          <svg width="16" height="16" viewBox="0 0 16 16" className="text-white fill-current">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }
    
    return (
      <div className="text-center font-medium text-black">
        {value}
      </div>
    );
  };

  return (
    <Card className={clsx('plan-comparison border-3 border-black shadow-brutal', className)}>
      <CardHeader className="border-b-3 border-black text-center">
        <h2 className="text-3xl font-bold font-[Space_Grotesk] text-black uppercase mb-2">
          COMPARE PLANS
        </h2>
        <p className="text-gray-600">
          Choose the perfect plan for your video generation needs
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <div className="comparison-table">
          {/* Plan Headers */}
          <div className="plan-headers grid grid-cols-4 border-b-3 border-black">
            <div className="header-cell p-6 border-r-3 border-black bg-gray-100">
              <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                FEATURES
              </div>
            </div>
            
            {plans.map((plan, index) => (
              <div 
                key={plan.id} 
                className={clsx(
                  'plan-header p-6 text-center',
                  {
                    'border-r-3 border-black': index < plans.length - 1,
                    'bg-gradient-to-br from-[#ff0080] to-[#ff69b4] text-white': plan.tier === 'premium',
                    'bg-white': plan.tier !== 'premium',
                  }
                )}
              >
                {/* Plan Badge */}
                {plan.popular && (
                  <div className="plan-badge mb-2">
                    <div className={clsx(
                      'inline-block px-2 py-1 text-xs font-bold uppercase border-2 border-black',
                      plan.tier === 'premium' ? 'bg-white text-[#ff0080]' : 'bg-[#00ff00] text-black'
                    )}>
                      {plan.tier === 'premium' ? 'MOST POPULAR' : 'POPULAR'}
                    </div>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className={clsx(
                  'text-xl font-bold font-[Space_Grotesk] uppercase mb-2',
                  plan.tier === 'premium' ? 'text-white' : 'text-black'
                )}>
                  {plan.name}
                </h3>

                {/* Plan Price */}
                <div className="plan-price mb-4">
                  <div className={clsx(
                    'text-2xl font-bold font-[Space_Grotesk]',
                    plan.tier === 'premium' ? 'text-white' : 'text-black'
                  )}>
                    {formatPrice(plan.price)}
                  </div>
                  {plan.interval !== 'one-time' && (
                    <div className={clsx(
                      'text-sm',
                      plan.tier === 'premium' ? 'text-pink-100' : 'text-gray-600'
                    )}>
                      per {plan.interval}
                    </div>
                  )}
                </div>

                {/* Current Plan Indicator */}
                {currentPlan === plan.tier && (
                  <div className="current-plan-badge mb-4">
                    <div className="bg-[#00ff00] text-black px-3 py-1 text-xs font-bold uppercase border-2 border-black">
                      CURRENT PLAN
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  onClick={() => onPlanSelect(plan)}
                  variant={plan.tier === 'premium' ? 'secondary' : plan.buttonVariant}
                  size="sm"
                  fullWidth
                  disabled={currentPlan === plan.tier}
                  className={clsx(
                    'font-bold uppercase text-xs',
                    {
                      'bg-white text-[#ff0080] border-white hover:bg-gray-100': plan.tier === 'premium',
                    }
                  )}
                >
                  {currentPlan === plan.tier ? 'CURRENT' : plan.buttonText}
                </Button>
              </div>
            ))}
          </div>

          {/* Feature Rows */}
          <div className="feature-rows">
            {features.map((feature, featureIndex) => (
              <div key={feature.id} className="feature-row">
                {/* Feature Name */}
                <div 
                  className={clsx(
                    'feature-name grid grid-cols-4',
                    featureIndex < features.length - 1 && 'border-b-2 border-gray-200'
                  )}
                >
                  <div 
                    className="feature-label p-4 border-r-3 border-black bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedFeature(
                      expandedFeature === feature.id ? null : feature.id
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-black">{feature.name}</div>
                        {feature.description && expandedFeature !== feature.id && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {feature.description}
                          </div>
                        )}
                      </div>
                      {feature.description && (
                        <div className="ml-2">
                          <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 16 16" 
                            className={clsx(
                              'transform transition-transform duration-200 text-gray-400 fill-current',
                              expandedFeature === feature.id && 'rotate-180'
                            )}
                          >
                            <path d="M4 6l4 4 4-4"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feature Values */}
                  {plans.map((plan, planIndex) => (
                    <div 
                      key={`${feature.id}-${plan.id}`}
                      className={clsx(
                        'feature-value p-4 flex items-center justify-center',
                        {
                          'border-r-2 border-gray-200': planIndex < plans.length - 1,
                          'bg-gradient-to-br from-[#ff0080]/5 to-[#ff69b4]/5': plan.tier === 'premium',
                        }
                      )}
                    >
                      {renderFeatureValue(feature, plan.tier)}
                    </div>
                  ))}
                </div>

                {/* Expanded Feature Description */}
                {expandedFeature === feature.id && feature.description && (
                  <div className="expanded-description grid grid-cols-4 border-b-2 border-gray-200">
                    <div className="description-content col-span-4 p-4 bg-blue-50 border-l-4 border-[#ff0080]">
                      <p className="text-sm text-gray-700">{feature.description}</p>
                      {feature.tooltip && (
                        <div className="mt-2 text-xs text-gray-500">
                          <strong>Note:</strong> {feature.tooltip}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="comparison-footer border-t-3 border-black p-6 bg-gray-100">
            <div className="text-center">
              <h3 className="text-lg font-bold font-[Space_Grotesk] text-black mb-2 uppercase">
                READY TO GET STARTED?
              </h3>
              <p className="text-gray-600 mb-4">
                Choose the plan that best fits your video generation needs
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto">
                {plans.filter(plan => plan.tier !== 'pay-per-video').map((plan) => (
                  <Button
                    key={plan.id}
                    onClick={() => onPlanSelect(plan)}
                    variant={plan.tier === 'premium' ? 'primary' : 'outline'}
                    size="md"
                    disabled={currentPlan === plan.tier}
                    className="font-bold uppercase"
                  >
                    {currentPlan === plan.tier ? 'CURRENT PLAN' : `START ${plan.name.toUpperCase()}`}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanComparison;