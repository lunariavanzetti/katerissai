import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const PrivacyPage: React.FC = () => {
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
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardContent className="p-8 prose prose-lg max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">1. Information We Collect</h2>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Kateriss AI</strong> ("we", "our", "us") collects information you provide directly to us when using our AI video generation service:
                </p>
                
                <h3 className="text-xl font-semibold text-black mt-6 mb-3">Personal Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Email address and name when you create an account</li>
                  <li>Payment information (processed securely by Paddle)</li>
                  <li>Profile information you choose to provide</li>
                </ul>

                <h3 className="text-xl font-semibold text-black mt-6 mb-3">Usage Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Text prompts you submit for video generation</li>
                  <li>Generated videos and metadata</li>
                  <li>Usage statistics and preferences</li>
                  <li>Technical data like IP address, browser type, and device information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Provide and improve our AI video generation service</li>
                  <li>Process payments and manage your account</li>
                  <li>Generate videos based on your text prompts</li>
                  <li>Send important service updates and notifications</li>
                  <li>Provide customer support</li>
                  <li>Analyze usage patterns to improve our service</li>
                  <li>Prevent fraud and ensure platform security</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">3. Information Sharing</h2>
                <p className="text-gray-700 leading-relaxed">
                  We do not sell, trade, or rent your personal information to third parties. We may share your information only in these limited circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Service Providers:</strong> With trusted partners like Paddle (payments), Supabase (database), and Google (AI processing)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  <li><strong>Consent:</strong> With your explicit permission</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">4. Data Storage and Security</h2>
                <p className="text-gray-700 leading-relaxed">
                  We implement appropriate security measures to protect your information:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Data encrypted in transit and at rest</li>
                  <li>Secure cloud infrastructure with Supabase</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Data backup and recovery procedures</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">5. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your information for different periods depending on the type:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Account Information:</strong> Until you delete your account</li>
                  <li><strong>Generated Videos:</strong> As long as your account is active</li>
                  <li><strong>Payment Records:</strong> As required by law (typically 7 years)</li>
                  <li><strong>Usage Analytics:</strong> Aggregated data may be retained indefinitely</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">6. Your Rights and Choices</h2>
                <p className="text-gray-700 leading-relaxed">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  To exercise these rights, contact us at support@kateriss.ai
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">7. Cookies and Tracking</h2>
                <p className="text-gray-700 leading-relaxed">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Keep you logged in to your account</li>
                  <li>Remember your preferences</li>
                  <li>Analyze site usage and performance</li>
                  <li>Provide personalized content</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  You can control cookies through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">8. Third-Party Services</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our service integrates with third-party providers:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Paddle:</strong> Payment processing (see Paddle's privacy policy)</li>
                  <li><strong>Supabase:</strong> Database and authentication</li>
                  <li><strong>Google AI:</strong> Video generation technology</li>
                  <li><strong>Vercel:</strong> Website hosting and deployment</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">9. International Data Transfers</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during international transfers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">10. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">11. Changes to This Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-black mb-4">12. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us:
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
                This Privacy Policy is effective as of {new Date().toLocaleDateString()} and was last updated on {new Date().toLocaleDateString()}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPage;