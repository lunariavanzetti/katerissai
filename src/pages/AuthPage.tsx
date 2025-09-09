import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { LoginForm, SignUpForm, PasswordReset } from '../components/auth';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { config } from '../config/env';

const AuthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'signup' || urlMode === 'signin' || urlMode === 'reset') {
      setMode(urlMode);
    }
  }, [searchParams]);

  const handleModeChange = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const getTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create Your Account';
      case 'reset':
        return 'Reset Password';
      default:
        return 'Welcome Back';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup':
        return 'Join thousands of creators using AI to generate stunning videos';
      case 'reset':
        return 'Enter your email to reset your password';
      default:
        return 'Sign in to continue creating amazing videos';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-20">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-primary border-3 border-black shadow-brutal">
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-2xl">K</span>
              </div>
            </div>
            <span className="font-bold text-2xl text-black">
              {config.app.name}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-black mb-2">
            {getTitle()}
          </h1>
          <p className="text-gray-600 font-medium">
            {getSubtitle()}
          </p>
        </div>

        {/* Auth Form */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {mode === 'signin' && <LoginForm />}
            {mode === 'signup' && <SignUpForm />}
            {mode === 'reset' && <PasswordReset />}
          </CardContent>
        </Card>

        {/* Mode Switcher */}
        {mode !== 'reset' && (
          <div className="text-center space-y-4">
            <div className="text-gray-600 font-medium">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            </div>
            <Button
              variant="ghost"
              onClick={() => handleModeChange(mode === 'signin' ? 'signup' : 'signin')}
              className="font-bold"
            >
              {mode === 'signin' ? 'Create Account' : 'Sign In Instead'}
            </Button>
          </div>
        )}

        {mode !== 'reset' && (
          <div className="text-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleModeChange('reset')}
            >
              Forgot Password?
            </Button>
          </div>
        )}

        {mode === 'reset' && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => handleModeChange('signin')}
            >
              Back to Sign In
            </Button>
          </div>
        )}

        {/* Features Preview for Sign Up */}
        {mode === 'signup' && (
          <div className="mt-12">
            <Card variant="pink">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-black mb-4 text-center">
                  🎬 Start Creating Today
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-secondary flex-shrink-0"></div>
                    <span className="text-gray-700 font-medium">1 free video generation</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-secondary flex-shrink-0"></div>
                    <span className="text-gray-700 font-medium">Google Veo 3 Fast AI technology</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-secondary flex-shrink-0"></div>
                    <span className="text-gray-700 font-medium">No credit card required</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-secondary flex-shrink-0"></div>
                    <span className="text-gray-700 font-medium">Upgrade anytime for more features</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Social Proof */}
        <div className="mt-12 text-center">
          <div className="text-sm text-gray-500 font-medium mb-4">
            Trusted by 10,000+ creators worldwide
          </div>
          <div className="flex justify-center space-x-4 text-2xl">
            <span>👩‍💼</span>
            <span>👨‍🎨</span>
            <span>🎭</span>
            <span>📱</span>
            <span>🎬</span>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center space-x-6 text-sm">
          <a href="/privacy" className="text-gray-500 hover:text-primary font-medium">
            Privacy Policy
          </a>
          <a href="/terms" className="text-gray-500 hover:text-primary font-medium">
            Terms of Service
          </a>
          <a href="/support" className="text-gray-500 hover:text-primary font-medium">
            Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;