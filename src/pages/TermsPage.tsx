import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const TermsPage: React.FC = () => {
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
            Terms & Conditions
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardContent className="p-8 prose prose-lg max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">1. Agreement to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using Kateriss AI Video Generator ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  This Service is operated by <strong>Kateriss AI</strong> ("Company", "we", "our", "us"). These Terms and Conditions govern your use of our AI-powered video generation platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">2. Description of Service</h2>
                <p className="text-gray-700 leading-relaxed">
                  Kateriss AI provides an artificial intelligence-powered video generation service that allows users to create videos from text descriptions. Our service includes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Pay-per-video generation ($2.49 per video)</li>
                  <li>Basic Monthly Subscription ($29/month for 20 videos)</li>
                  <li>Premium Monthly Subscription ($149/month for unlimited videos)</li>
                  <li>Cloud storage for generated content</li>
                  <li>User account management</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">3. User Accounts</h2>
                <p className="text-gray-700 leading-relaxed">
                  To access certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">4. Payment and Billing</h2>
                <p className="text-gray-700 leading-relaxed">
                  Payment processing is handled by Paddle. By purchasing our services, you agree to Paddle's terms of service. All payments are processed securely and we do not store your payment information.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Subscription fees are billed monthly in advance</li>
                  <li>Pay-per-video charges are processed immediately</li>
                  <li>Prices are subject to change with 30 days notice</li>
                  <li>All sales are final unless otherwise specified in our Refund Policy</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">5. Acceptable Use</h2>
                <p className="text-gray-700 leading-relaxed">
                  You agree not to use the Service to generate content that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Is illegal, harmful, or violates any laws</li>
                  <li>Contains hate speech, harassment, or discrimination</li>
                  <li>Infringes on intellectual property rights</li>
                  <li>Contains adult content or nudity</li>
                  <li>Promotes violence or illegal activities</li>
                  <li>Violates privacy rights of individuals</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">6. Intellectual Property</h2>
                <p className="text-gray-700 leading-relaxed">
                  You retain ownership of the text prompts you submit. Generated videos are licensed to you for your use according to your subscription tier:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Pay-per-video and Basic:</strong> Personal use license</li>
                  <li><strong>Premium:</strong> Commercial use license included</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">7. Service Availability</h2>
                <p className="text-gray-700 leading-relaxed">
                  We strive to maintain 99% uptime but do not guarantee uninterrupted service. We may temporarily suspend service for maintenance or updates.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  In no event shall Kateriss AI be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">9. Termination</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">10. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">11. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms & Conditions, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded border-2 border-black">
                  <p className="font-semibold">Kateriss AI</p>
                  <p>Email: support@kateriss.ai</p>
                  <p>Website: https://katerissai.vercel.app</p>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t-3 border-black">
              <p className="text-sm text-gray-500">
                These Terms & Conditions are effective as of {new Date().toLocaleDateString()} and were last updated on {new Date().toLocaleDateString()}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsPage;