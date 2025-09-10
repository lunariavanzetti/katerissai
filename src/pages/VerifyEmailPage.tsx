import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { useAuthContext, useAuthActions } from '../contexts/AuthContext';
import { showToast } from '../components/ui/Toast';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuthContext();
  const { refreshSession } = useAuthActions();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    if (token && type) {
      // If there's a token, the verification happens automatically via Supabase
      // We just need to refresh the session to get the updated user state
      const verifyEmail = async () => {
        setVerifying(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Give Supabase time to process
          await refreshSession();
          setVerified(true);
          showToast.success('Email verified successfully! 🎉');
        } catch (error) {
          showToast.error('Verification failed. Please try again.');
        } finally {
          setVerifying(false);
        }
      };

      verifyEmail();
    }
  }, [token, type, refreshSession]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loading size="lg" className="mb-6" />
            <h1 className="text-2xl font-bold uppercase tracking-wide text-black mb-4">
              Verifying Email
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verified || (user?.email_confirmed_at)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-[#00ff00] border-3 border-black rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold uppercase tracking-wide text-black mb-4">
              Email Verified! 🎉
            </h1>
            <p className="text-gray-600 mb-8">
              Your email has been successfully verified. You can now access all features of Kateriss AI.
            </p>
            
            <div className="space-y-4">
              <Link to="/dashboard">
                <Button variant="primary" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/generate">
                <Button variant="outline" className="w-full">
                  Start Generating Videos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default state - no token or verification needed
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-[#ff0080] border-3 border-black rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold uppercase tracking-wide text-black mb-4">
            Check Your Email
          </h1>
          <p className="text-gray-600 mb-8">
            We've sent you a verification link. Please check your email and click the link to verify your account.
          </p>
          
          <div className="space-y-4">
            <Link to="/auth?mode=signin">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
            
            <div className="text-sm text-gray-500">
              <p>Didn't receive the email?</p>
              <button 
                onClick={() => showToast.info('Resend feature coming soon!')}
                className="text-[#ff0080] hover:text-[#ff69b4] underline underline-offset-2"
              >
                Resend verification email
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;