// LoginForm Component for Kateriss AI Video Generator
// Brutalist design with pink accents and comprehensive form validation

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext, useAuthActions } from '../../contexts/AuthContext';
import { Button, Input, Card, Loading } from '../ui';
import { showToast } from '../ui/Toast';
import type { SignInCredentials, AuthFormProps } from '../../types/auth';

// =============================================================================
// FORM DATA INTERFACE
// =============================================================================

interface LoginFormData extends SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// =============================================================================
// MAIN LOGIN FORM COMPONENT
// =============================================================================

export const LoginForm: React.FC<AuthFormProps> = ({
  onSuccess,
  onError,
  redirectTo,
  className = '',
  showSocialLogin = true,
  showRememberMe = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithProvider } = useAuthActions();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Form setup with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    clearErrors,
    watch,
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Watch form values for real-time validation feedback
  const watchedValues = watch();

  // Get redirect path from location state or use default
  const from = location.state?.from || redirectTo || '/dashboard';

  // ==========================================================================
  // FORM SUBMISSION
  // ==========================================================================

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    clearErrors();

    try {
      const result = await signIn({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (result.success) {
        showToast.success('Welcome back! 🎉');
        
        if (onSuccess) {
          onSuccess(result);
        } else {
          navigate(from, { replace: true });
        }
      } else {
        const errorMessage = result.error || 'Failed to sign in';
        
        // Handle specific errors
        if (errorMessage.toLowerCase().includes('invalid')) {
          setError('email', { message: 'Invalid email or password' });
          setError('password', { message: 'Invalid email or password' });
        } else if (errorMessage.toLowerCase().includes('email')) {
          setError('email', { message: errorMessage });
        } else if (errorMessage.toLowerCase().includes('password')) {
          setError('password', { message: errorMessage });
        } else {
          showToast.error(errorMessage);
        }

        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred';
      showToast.error(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // SOCIAL LOGIN
  // ==========================================================================

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    if (socialLoading) return;

    setSocialLoading(provider);

    try {
      const result = await signInWithProvider(provider);

      if (result.success) {
        showToast.success(`Redirecting to ${provider}...`);
        // OAuth redirect will handle the rest
      } else {
        const errorMessage = result.error || `Failed to sign in with ${provider}`;
        showToast.error(errorMessage);
        
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = `Failed to sign in with ${provider}`;
      showToast.error(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  // ==========================================================================
  // VALIDATION RULES
  // ==========================================================================

  const validationRules = {
    email: {
      required: 'Email is required',
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Enter a valid email address'
      }
    },
    password: {
      required: 'Password is required',
      minLength: {
        value: 1,
        message: 'Password is required'
      }
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Card className="brutal-card-pink p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold uppercase tracking-wide text-black">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-sm">
            Sign in to your Kateriss AI account
          </p>
        </div>

        {/* Social Login */}
        {showSocialLogin && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => handleSocialLogin('google')}
              loading={socialLoading === 'google'}
              className="flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => handleSocialLogin('github')}
              loading={socialLoading === 'github'}
              className="flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-3 border-black"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-bold uppercase tracking-wide">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email Input */}
          <Input
            type="email"
            label="Email Address"
            placeholder="your@email.com"
            error={errors.email?.message}
            success={watchedValues.email && !errors.email ? 'Valid email' : undefined}
            autoComplete="email"
            {...register('email', validationRules.email)}
          />

          {/* Password Input */}
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message}
            autoComplete="current-password"
            {...register('password', validationRules.password)}
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            {showRememberMe && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 border-3 border-black bg-white checked:bg-[#ff0080] focus:ring-2 focus:ring-[#ff0080] focus:ring-offset-2"
                  {...register('rememberMe')}
                />
                <span className="text-sm font-medium text-gray-700">
                  Remember me
                </span>
              </label>
            )}

            <Link
              to="/auth/forgot-password"
              className="text-sm text-[#ff0080] hover:text-[#ff69b4] font-semibold underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={!isValid}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center border-t-3 border-black pt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/auth/signup"
              className="text-[#ff0080] hover:text-[#ff69b4] font-bold underline underline-offset-2"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

// =============================================================================
// COMPACT LOGIN FORM (for modals/smaller spaces)
// =============================================================================

interface CompactLoginFormProps extends Omit<AuthFormProps, 'showSocialLogin'> {
  onCancel?: () => void;
  title?: string;
}

export const CompactLoginForm: React.FC<CompactLoginFormProps> = ({
  onSuccess,
  onError,
  onCancel,
  title = 'Sign In',
  className = '',
}) => {
  const { signIn } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await signIn({
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        showToast.success('Signed in successfully!');
        if (onSuccess) onSuccess(result);
      } else {
        const errorMessage = result.error || 'Failed to sign in';
        showToast.error(errorMessage);
        if (onError) onError(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred';
      showToast.error(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-sm ${className}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-bold uppercase tracking-wide text-black text-center mb-4">
          {title}
        </h2>

        <Input
          type="email"
          label="Email"
          placeholder="your@email.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email'
            }
          })}
        />

        <Input
          type="password"
          label="Password"
          placeholder="Password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required'
          })}
        />

        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!isValid}
            className="flex-1"
          >
            Sign In
          </Button>
        </div>
      </form>
    </div>
  );
};