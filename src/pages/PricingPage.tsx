import React from 'react';
import { PricingCards } from '../components/payment/PricingCards';
import { PlanComparison } from '../components/payment/PlanComparison';
import { Card, CardContent } from '../components/ui/Card';

const PricingPage: React.FC = () => {
  const faqs = [
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time. You will continue to have access until the end of your current billing period.',
    },
    {
      question: 'What happens to my videos if I cancel?',
      answer: 'Your generated videos remain accessible for 30 days after cancellation. Premium users with commercial rights keep those rights permanently.',
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 14-day money-back guarantee on all subscription plans. Pay-per-video purchases are non-refundable once processing begins.',
    },
    {
      question: 'What are commercial rights?',
      answer: 'Commercial rights allow you to use generated videos for business purposes, marketing, advertising, and monetization. This is included with Premium plans.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'New users get 1 free video generation to test our platform. No credit card required for the trial.',
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes, you can change your plan at any time. Upgrades are prorated immediately, and downgrades take effect at your next billing cycle.',
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-6xl font-bold text-black mb-6">
            Choose Your <span className="text-gradient">Perfect Plan</span>
          </h1>
          <p className="text-xl text-gray-600 font-medium max-w-3xl mx-auto">
            Transparent pricing with no hidden fees. Start free, scale as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mb-20">
          <PricingCards />
        </div>

        {/* Plan Comparison */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">
              Compare All Features
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              See exactly what's included in each plan
            </p>
          </div>
          <PlanComparison />
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Everything you need to know about our pricing and plans
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {faqs.map((faq, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-8 space-y-4">
                  <h3 className="text-xl font-bold text-black">{faq.question}</h3>
                  <p className="text-gray-700 font-medium leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="brutal-card-pink p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-black mb-4">
              Still Have Questions?
            </h2>
            <p className="text-lg text-gray-700 font-medium mb-8">
              Our team is here to help you choose the right plan for your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@kateriss.ai" 
                className="btn btn-primary"
              >
                Contact Support
              </a>
              <a 
                href="/auth?mode=signup" 
                className="btn btn-secondary"
              >
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;