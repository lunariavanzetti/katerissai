import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const RefundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              ← Back to Home
            </Button>
          </Link>
          
          <h1 className="text-4xl font-bold uppercase tracking-wide text-black mb-4">
            Refund Policy
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardContent className="p-8 prose prose-lg max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">1. Overview</h2>
                <p className="text-gray-700 leading-relaxed">
                  At <strong>Kateriss AI</strong>, we strive to provide exceptional AI video generation services. This Refund Policy outlines the circumstances under which refunds may be provided and the process for requesting them.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">2. Refund Eligibility</h2>
                
                <h3 className="text-xl font-semibold text-black mt-6 mb-3">Pay-per-Video ($2.49)</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Technical Failure:</strong> Full refund if video generation fails due to system error</li>
                  <li><strong>Service Unavailable:</strong> Refund if service is unavailable for more than 24 hours</li>
                  <li><strong>Quality Issues:</strong> Refund if generated video is significantly corrupted or unusable</li>
                  <li><strong>No Refund:</strong> If you're unsatisfied with AI interpretation of your prompt</li>
                </ul>

                <h3 className="text-xl font-semibold text-black mt-6 mb-3">Basic Monthly Subscription ($29/month)</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>First 7 Days:</strong> Full refund if you cancel within 7 days of initial subscription</li>
                  <li><strong>Unused Period:</strong> Pro-rated refund for unused portion if service is discontinued by us</li>
                  <li><strong>Technical Issues:</strong> Pro-rated refund if service is unavailable for more than 48 consecutive hours</li>
                  <li><strong>No Refund:</strong> After 7-day period, unless service fault</li>
                </ul>

                <h3 className="text-xl font-semibold text-black mt-6 mb-3">Premium Monthly Subscription ($149/month)</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>First 14 Days:</strong> Full refund if you cancel within 14 days of initial subscription</li>
                  <li><strong>Unused Period:</strong> Pro-rated refund for unused portion if service is discontinued by us</li>
                  <li><strong>Technical Issues:</strong> Pro-rated refund if service is unavailable for more than 24 consecutive hours</li>
                  <li><strong>Feature Unavailability:</strong> Partial refund if premium features are unavailable for extended periods</li>
                  <li><strong>No Refund:</strong> After 14-day period, unless service fault</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">3. Non-Refundable Situations</h2>
                <p className="text-gray-700 leading-relaxed">
                  Refunds will NOT be provided in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Dissatisfaction with AI-generated content quality or interpretation</li>
                  <li>Change of mind after successful video generation</li>
                  <li>Violation of Terms of Service resulting in account termination</li>
                  <li>Failure to use subscription credits within the billing period</li>
                  <li>Request made after refund eligibility period has expired</li>
                  <li>Requests for content that violates our Acceptable Use Policy</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">4. How to Request a Refund</h2>
                <p className="text-gray-700 leading-relaxed">
                  To request a refund, please follow these steps:
                </p>
                <ol className="list-decimal pl-6 space-y-3 text-gray-700">
                  <li>
                    <strong>Contact Support:</strong> Email us at <span className="font-mono bg-gray-100 px-1 rounded">support@kateriss.ai</span> within the eligible refund period
                  </li>
                  <li>
                    <strong>Provide Information:</strong> Include your account email, order/subscription ID, and reason for refund request
                  </li>
                  <li>
                    <strong>Documentation:</strong> For technical issues, provide screenshots or error descriptions
                  </li>
                  <li>
                    <strong>Review Process:</strong> We'll review your request within 2-3 business days
                  </li>
                  <li>
                    <strong>Resolution:</strong> Approved refunds will be processed within 5-7 business days
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">5. Refund Processing</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Payment Method:</strong> Refunds will be issued to the original payment method</li>
                  <li><strong>Processing Time:</strong> 5-7 business days for most payment methods</li>
                  <li><strong>Currency:</strong> Refunds will be in the original currency of purchase</li>
                  <li><strong>Transaction Fees:</strong> Payment processing fees are non-refundable</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">6. Subscription Cancellation</h2>
                <p className="text-gray-700 leading-relaxed">
                  You can cancel your subscription at any time:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Log into your account and go to Billing settings</li>
                  <li>Click "Cancel Subscription" and follow the prompts</li>
                  <li>You'll retain access until the end of your current billing period</li>
                  <li>No partial refunds for early cancellation after refund period</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">7. Trial Periods</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Basic Plan:</strong> 7-day trial period included</li>
                  <li><strong>Premium Plan:</strong> 14-day trial period included</li>
                  <li><strong>Trial Cancellation:</strong> Cancel anytime during trial for no charge</li>
                  <li><strong>Auto-Renewal:</strong> Trials automatically convert to paid subscriptions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">8. Force Majeure</h2>
                <p className="text-gray-700 leading-relaxed">
                  In cases of events beyond our control (natural disasters, government regulations, third-party service outages), we may provide service credits or partial refunds at our discretion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">9. Dispute Resolution</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you're unsatisfied with our refund decision:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Contact our support team for escalation</li>
                  <li>Provide additional documentation if requested</li>
                  <li>We'll review escalated cases within 5 business days</li>
                  <li>Final decisions will be communicated in writing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">10. Policy Updates</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Refund Policy to reflect changes in our service or legal requirements. Material changes will be communicated to existing subscribers via email.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">11. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  For refund requests or questions about this policy:
                </p>
                <div className="bg-gray-50 p-4 rounded border-2 border-black">
                  <p className="font-semibold">Kateriss AI Support</p>
                  <p>Email: support@kateriss.ai</p>
                  <p>Response Time: 2-3 business days</p>
                  <p>Website: https://katerissai.vercel.app</p>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t-3 border-black">
              <p className="text-sm text-gray-500">
                This Refund Policy is effective as of {new Date().toLocaleDateString()} and was last updated on {new Date().toLocaleDateString()}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RefundPage;