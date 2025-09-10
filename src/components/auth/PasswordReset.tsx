// PasswordReset Component for Kateriss AI Video Generator
// Complete password reset flow with brutalist design

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext} from '../contexts/AuthContext';
import { Button, Input, Card } from '../ui';
import { showToast } from '../ui/Toast';
import { config } from '../../config/env';

// =============================================================================
// FORM DATA INTERFACES
// =============================================================================

interface ForgotPasswordFormData {
  email: string;
}

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

// =============================================================================
// PASSWORD RESET REQUEST COMPONENT
// =============================================================================

export const ForgotPasswordForm: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { resetPassword } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ForgotPasswordFormData>({
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  const watchedEmail = watch('email');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await resetPassword(data.email);

      if (result.success) {
        setEmailSent(true);
        setSentEmail(data.email);
        showToast.success('Password reset email sent! 📧');
      } else {
        const errorMessage = result.error || 'Failed to send reset email';
        showToast.error(errorMessage);
      }
    } catch (error) {
      showToast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!sentEmail) return;
    
    setIsSubmitting(true);
    try {
      const result = await resetPassword(sentEmail);
      if (result.success) {
        showToast.success('Reset email sent again!');
      } else {
        showToast.error('Failed to resend email');
      }
    } catch (error) {
      showToast.error('Failed to resend email');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <Card className="brutal-card-pink p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-[#00ff00] border-3 border-black flex items-center justify-center">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-black mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-600 text-sm mb-4">
              We've sent a password reset link to:
            </p>
            <p className="text-[#ff0080] font-semibold break-all">
              {sentEmail}
            </p>
          </div>

          <div className="p-4 bg-gray-50 border-3 border-black text-left text-sm text-gray-600 space-y-2">
            <p className="font-semibold text-black">Next steps:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the reset link in the email</li>
              <li>Create your new password</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              variant="secondary"
              fullWidth
              loading={isSubmitting}
            >
              Resend Email
            </Button>

            <Link to="/auth/login">
              <Button variant="outline" fullWidth>
                Back to Sign In
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or try a different email address.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Card className="brutal-card-pink p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold uppercase tracking-wide text-black">
            Reset Password
          </h1>
          <p className="text-gray-600 text-sm">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            type="email"
            label="Email Address"
            placeholder="your@email.com"
            error={errors.email?.message}
            success={watchedEmail && !errors.email ? 'Valid email' : undefined}
            autoComplete="email"
            autoFocus
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address'
              }
            })}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={!isValid}
          >
            {isSubmitting ? 'Sending Reset Link...' : 'Send Reset Link'}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="text-center border-t-3 border-black pt-6">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link
              to="/auth/login"
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

// =============================================================================
// PASSWORD RESET CONFIRMATION COMPONENT
// =============================================================================

export const ResetPasswordForm: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword } = useAuthActions();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    getValues,
  } = useForm<ResetPasswordFormData>({
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('password');

  // Check if we have the necessary URL parameters
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    
    if (!accessToken || !refreshToken || type !== 'recovery') {
      setIsValidToken(false);
    }
  }, [searchParams]);

  // Password strength checker (simplified version)
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: 'Enter a password', color: 'gray' };
    
    let strength = 0;
    if (password.length >= config.auth.passwordMinLength) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
    
    if (strength >= 4) return { strength, label: 'Strong', color: '#00ff00' };
    if (strength >= 3) return { strength, label: 'Good', color: '#ff0080' };
    if (strength >= 2) return { strength, label: 'Fair', color: '#ff6600' };
    return { strength, label: 'Weak', color: '#ff0000' };
  };

  const passwordStrength = getPasswordStrength(watchedPassword || '');

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await updatePassword(data.password);

      if (result.success) {
        showToast.success('Password updated successfully! 🎉');
        navigate('/auth/login', { 
          state: { message: 'Password updated! Please sign in with your new password.' }
        });
      } else {
        const errorMessage = result.error || 'Failed to update password';
        showToast.error(errorMessage);
      }
    } catch (error) {
      showToast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Invalid token UI
  if (!isValidToken) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <Card className="brutal-card p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-500 border-3 border-black flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-black mb-2">
              Invalid Reset Link
            </h1>
            <p className="text-gray-600 text-sm mb-4">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div className="space-y-3">
            <Link to="/auth/forgot-password">
              <Button variant="primary" fullWidth>
                Request New Reset Link
              </Button>
            </Link>

            <Link to="/auth/login">
              <Button variant="outline" fullWidth>
                Back to Sign In
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Card className="brutal-card-pink p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold uppercase tracking-wide text-black">
            New Password
          </h1>
          <p className="text-gray-600 text-sm">
            Create a strong password for your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* New Password */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="New Password"
                placeholder="Create a strong password"
                error={errors.password?.message}
                autoComplete="new-password"
                autoFocus
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: config.auth.passwordMinLength,
                    message: `Password must be at least ${config.auth.passwordMinLength} characters`
                  },
                  validate: (value) => {
                    const strength = getPasswordStrength(value);
                    return strength.strength >= 3 || 'Password is too weak';
                  }
                })}
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
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 border-2 border-black">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(passwordStrength.strength / 5) * 100}%`,
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
            )}
          </div>

          {/* Confirm Password */}
          <Input
            type="password"
            label="Confirm New Password"
            placeholder="Confirm your password"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => {
                const password = getValues('password');
                return value === password || 'Passwords do not match';
              }
            })}
          />

          {/* Password Requirements */}
          <div className="p-4 bg-gray-50 border-3 border-black text-sm text-gray-600">
            <p className="font-semibold text-black mb-2">Password must contain:</p>
            <ul className="space-y-1 text-xs">
              <li className="flex items-center gap-2">
                <span className={watchedPassword && watchedPassword.length >= config.auth.passwordMinLength ? 'text-[#00ff00]' : 'text-gray-400'}>
                  ✓
                </span>
                At least {config.auth.passwordMinLength} characters
              </li>
              <li className="flex items-center gap-2">
                <span className={watchedPassword && /[A-Z]/.test(watchedPassword) ? 'text-[#00ff00]' : 'text-gray-400'}>
                  ✓
                </span>
                One uppercase letter
              </li>
              <li className="flex items-center gap-2">
                <span className={watchedPassword && /[a-z]/.test(watchedPassword) ? 'text-[#00ff00]' : 'text-gray-400'}>
                  ✓
                </span>
                One lowercase letter
              </li>
              <li className="flex items-center gap-2">
                <span className={watchedPassword && /\d/.test(watchedPassword) ? 'text-[#00ff00]' : 'text-gray-400'}>
                  ✓
                </span>
                One number
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={!isValid}
          >
            {isSubmitting ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="text-center border-t-3 border-black pt-6">
          <Link
            to="/auth/login"
            className="text-sm text-[#ff0080] hover:text-[#ff69b4] font-bold underline underline-offset-2"
          >
            Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};

// =============================================================================
// MAIN EXPORT - PASSWORD RESET ROUTER
// =============================================================================

export const PasswordReset: React.FC<{ className?: string }> = ({ className }) => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  
  // Show reset form if we have recovery tokens, otherwise show forgot password form
  return type === 'recovery' ? (
    <ResetPasswordForm className={className} />
  ) : (
    <ForgotPasswordForm className={className} />
  );
};