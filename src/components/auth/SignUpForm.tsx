// SignUpForm Component for Kateriss AI Video Generator
// Brutalist design with pink accents and comprehensive registration flow

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext, useAuthActions } from '../../contexts/AuthContext';
import { Button, Input, Card } from '../ui';
import { showToast } from '../ui/Toast';
import { config } from '../../config/env';
import type { SignUpCredentials, AuthFormProps } from '../../types/auth';

// =============================================================================
// FORM DATA INTERFACE
// =============================================================================

interface SignUpFormData extends SignUpCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  termsAccepted: boolean;
  marketingConsent: boolean;
}

// =============================================================================
// PASSWORD STRENGTH CHECKER
// =============================================================================

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
  label: string;
}

const checkPasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return { score: 0, feedback: [], color: 'gray', label: 'Enter a password' };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= config.auth.passwordMinLength) {
    score += 1;
  } else {
    feedback.push(`At least ${config.auth.passwordMinLength} characters`);
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  // Return strength assessment
  if (score === 5) {
    return { score, feedback: [], color: '#00ff00', label: 'Very Strong' };
  } else if (score >= 4) {
    return { score, feedback, color: '#ff0080', label: 'Strong' };
  } else if (score >= 3) {
    return { score, feedback, color: '#ff6600', label: 'Fair' };
  } else if (score >= 2) {
    return { score, feedback, color: '#ff9900', label: 'Weak' };
  } else {
    return { score, feedback, color: '#ff0000', label: 'Too Weak' };
  }
};

// =============================================================================
// MAIN SIGNUP FORM COMPONENT
// =============================================================================

export const SignUpForm: React.FC<AuthFormProps> = ({
  onSuccess,
  onError,
  redirectTo,
  className = '',
  showSocialLogin = true,
}) => {
  const navigate = useNavigate();
  const { signUp, signInWithProvider } = useAuthActions();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form setup with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    clearErrors,
    watch,
    getValues,
  } = useForm<SignUpFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      termsAccepted: false,
      marketingConsent: false,
    },
  });

  // Watch password for strength indicator
  const watchedPassword = watch('password');
  const passwordStrength = checkPasswordStrength(watchedPassword || '');

  // ==========================================================================
  // FORM SUBMISSION
  // ==========================================================================

  const onSubmit = async (data: SignUpFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    clearErrors();

    try {
      // Validate password strength
      if (passwordStrength.score < 3) {
        setError('password', {
          message: 'Password is too weak. Please choose a stronger password.'
        });
        return;
      }

      const result = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        termsAccepted: data.termsAccepted,
        marketingConsent: data.marketingConsent,
      });

      if (result.success) {
        showToast.success('Account created! Please check your email to verify your account. ✨');
        
        if (onSuccess) {
          onSuccess(result);
        } else {
          navigate(redirectTo || '/auth/verify-email');
        }
      } else {
        const errorMessage = result.error || 'Failed to create account';
        
        // Handle specific errors
        if (errorMessage.toLowerCase().includes('email')) {
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
      const errorMessage = 'An unexpected error occurred during registration';
      showToast.error(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // SOCIAL SIGNUP
  // ==========================================================================

  const handleSocialSignUp = async (provider: 'google' | 'github') => {
    if (socialLoading) return;

    setSocialLoading(provider);

    try {
      const result = await signInWithProvider(provider);

      if (result.success) {
        showToast.success(`Redirecting to ${provider}...`);
        // OAuth redirect will handle the rest
      } else {
        const errorMessage = result.error || `Failed to sign up with ${provider}`;
        showToast.error(errorMessage);
        
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = `Failed to sign up with ${provider}`;
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
    fullName: {
      required: 'Full name is required',
      minLength: {
        value: 2,
        message: 'Full name must be at least 2 characters'
      },
      maxLength: {
        value: 50,
        message: 'Full name must be less than 50 characters'
      },
      pattern: {
        value: /^[a-zA-Z\s'-]+$/,
        message: 'Full name can only contain letters, spaces, hyphens, and apostrophes'
      }
    },
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
        value: config.auth.passwordMinLength,
        message: `Password must be at least ${config.auth.passwordMinLength} characters`
      },
      validate: (value: string) => {
        const strength = checkPasswordStrength(value);
        return strength.score >= 3 || 'Password is too weak';
      }
    },
    confirmPassword: {
      required: 'Please confirm your password',
      validate: (value: string) => {
        const password = getValues('password');
        return value === password || 'Passwords do not match';
      }
    },
    termsAccepted: {
      required: 'You must accept the terms and conditions'
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
            Join Kateriss AI
          </h1>
          <p className="text-gray-600 text-sm">
            Create your account and start generating amazing videos
          </p>
        </div>

        {/* Social Signup */}
        {showSocialLogin && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => handleSocialSignUp('google')}
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
              onClick={() => handleSocialSignUp('github')}
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
                  Or sign up with email
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Full Name */}
          <Input
            type="text"
            label="Full Name"
            placeholder="Enter your full name"
            error={errors.fullName?.message}
            autoComplete="name"
            {...register('fullName', validationRules.fullName)}
          />

          {/* Email */}
          <Input
            type="email"
            label="Email Address"
            placeholder="your@email.com"
            error={errors.email?.message}
            autoComplete="email"
            {...register('email', validationRules.email)}
          />

          {/* Password with Strength Indicator */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Create a strong password"
                error={errors.password?.message}
                autoComplete="new-password"
                {...register('password', validationRules.password)}
              />
              
              {/* Show/Hide Password Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {watchedPassword && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 border-2 border-black">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                
                {passwordStrength.feedback.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <p>Password needs:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <Input
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register('confirmPassword', validationRules.confirmPassword)}
          />

          {/* Terms and Conditions */}
          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 border-3 border-black bg-white checked:bg-[#ff0080] focus:ring-2 focus:ring-[#ff0080] focus:ring-offset-2"
                {...register('termsAccepted', validationRules.termsAccepted)}
              />
              <div className="text-sm">
                <span className="text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#ff0080] underline underline-offset-2 hover:text-[#ff69b4]">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#ff0080] underline underline-offset-2 hover:text-[#ff69b4]">
                    Privacy Policy
                  </Link>
                </span>
                {errors.termsAccepted && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {errors.termsAccepted.message}
                  </p>
                )}
              </div>
            </label>

            {/* Marketing Consent (Optional) */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 border-3 border-black bg-white checked:bg-[#ff0080] focus:ring-2 focus:ring-[#ff0080] focus:ring-offset-2"
                {...register('marketingConsent')}
              />
              <span className="text-sm text-gray-700">
                I'd like to receive updates and marketing communications from Kateriss AI
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={!isValid}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="text-center border-t-3 border-black pt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/auth?mode=signin"
              className="text-[#ff0080] hover:text-[#ff69b4] font-bold underline underline-offset-2"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};