// Supabase Authentication Service for Kateriss AI Video Generator
// Handles all auth operations with proper error handling and security

import { 
  AuthTokenResponsePassword,
  AuthTokenResponse,
  AuthResponse,
  OAuthResponse,
  UserResponse,
} from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import type { 
  SignUpCredentials,
  SignInCredentials,
  AuthResult,
  AuthProvider,
  UserProfile,
  LoginAttempt,
  ProfileUpdateData
} from '../types/auth';

// =============================================================================
// LOGIN ATTEMPT TRACKING
// =============================================================================

class LoginAttemptTracker {
  private attempts: Map<string, LoginAttempt[]> = new Map();
  private readonly maxAttempts = env.auth.maxLoginAttempts;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes

  isLocked(email: string): boolean {
    const userAttempts = this.attempts.get(email.toLowerCase()) || [];
    const recentFailedAttempts = userAttempts.filter(
      attempt => 
        !attempt.successful && 
        Date.now() - attempt.timestamp.getTime() < this.lockoutDuration
    );
    
    return recentFailedAttempts.length >= this.maxAttempts;
  }

  addAttempt(email: string, successful: boolean): void {
    const normalizedEmail = email.toLowerCase();
    const attempts = this.attempts.get(normalizedEmail) || [];
    
    attempts.push({
      email: normalizedEmail,
      timestamp: new Date(),
      successful,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
    });

    // Keep only recent attempts (last 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentAttempts = attempts.filter(
      attempt => attempt.timestamp.getTime() > dayAgo
    );

    this.attempts.set(normalizedEmail, recentAttempts);
  }

  private getClientIP(): string {
    // In production, you'd get this from a service or header
    return 'unknown';
  }

  getRemainingLockoutTime(email: string): number {
    if (!this.isLocked(email)) return 0;
    
    const userAttempts = this.attempts.get(email.toLowerCase()) || [];
    const lastFailedAttempt = userAttempts
      .filter(attempt => !attempt.successful)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (!lastFailedAttempt) return 0;

    const lockoutEnd = lastFailedAttempt.timestamp.getTime() + this.lockoutDuration;
    return Math.max(0, lockoutEnd - Date.now());
  }
}

const loginTracker = new LoginAttemptTracker();

// =============================================================================
// AUTH SERVICE CLASS
// =============================================================================

export class AuthService {
  private static instance: AuthService;
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // ==========================================================================
  // SIGN UP
  // ==========================================================================

  async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    try {
      const { email, password, fullName, termsAccepted } = credentials;

      // Validate input
      if (!termsAccepted) {
        return {
          success: false,
          error: 'You must accept the terms and conditions to create an account'
        };
      }

      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }

      if (!this.isValidPassword(password)) {
        return {
          success: false,
          error: `Password must be at least ${env.auth.passwordMinLength} characters long`
        };
      }

      // Sign up with Supabase
      const { data, error }: AuthResponse = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: fullName?.trim() || null,
            marketing_consent: credentials.marketingConsent || false,
          },
          emailRedirectTo: env.auth.redirectUrl,
        },
      });

      if (error) {
        return {
          success: false,
          error: this.handleAuthError(error)
        };
      }

      // Create user profile if user was created successfully
      if (data.user && !data.user.email_confirmed_at) {
        // Profile will be created via database trigger after email confirmation
        return {
          success: true,
          data: {
            user: data.user,
            session: data.session,
            message: 'Account created successfully! Please check your email to verify your account.'
          }
        };
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
          message: 'Account created successfully!'
        }
      };

    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during signup. Please try again.'
      };
    }
  }

  // ==========================================================================
  // SIGN IN
  // ==========================================================================

  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    try {
      const { email, password, rememberMe } = credentials;
      const normalizedEmail = email.toLowerCase().trim();

      // Check if account is locked
      if (loginTracker.isLocked(normalizedEmail)) {
        const remainingTime = loginTracker.getRemainingLockoutTime(normalizedEmail);
        const minutes = Math.ceil(remainingTime / (60 * 1000));
        
        return {
          success: false,
          error: `Account temporarily locked due to too many failed attempts. Try again in ${minutes} minutes.`
        };
      }

      // Attempt sign in
      const { data, error }: AuthTokenResponsePassword = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      // Track login attempt
      const successful = !error && !!data.user;
      loginTracker.addAttempt(normalizedEmail, successful);

      if (error || !data.user) {
        return {
          success: false,
          error: this.handleAuthError(error) || 'Invalid email or password'
        };
      }

      // Handle remember me functionality
      if (rememberMe) {
        // Extend session duration (this would need custom session management)
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      // Update last login time
      if (data.user.id) {
        await this.updateLastLogin(data.user.id);
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
          message: 'Welcome back!'
        }
      };

    } catch (error) {
      console.error('Signin error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during sign in. Please try again.'
      };
    }
  }

  // ==========================================================================
  // SOCIAL SIGN IN
  // ==========================================================================

  async signInWithProvider(provider: AuthProvider): Promise<AuthResult> {
    try {
      const { data, error }: OAuthResponse = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: env.auth.redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: this.handleAuthError(error)
        };
      }

      return {
        success: true,
        data: {
          message: `Redirecting to ${provider} for authentication...`
        }
      };

    } catch (error) {
      console.error(`${provider} signin error:`, error);
      return {
        success: false,
        error: `Failed to sign in with ${provider}. Please try again.`
      };
    }
  }

  // ==========================================================================
  // SIGN OUT
  // ==========================================================================

  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: this.handleAuthError(error)
        };
      }

      // Clear local storage
      localStorage.removeItem('rememberMe');
      
      return {
        success: true,
        data: {
          message: 'Signed out successfully'
        }
      };

    } catch (error) {
      console.error('Signout error:', error);
      return {
        success: false,
        error: 'An error occurred while signing out'
      };
    }
  }

  // ==========================================================================
  // PASSWORD RESET
  // ==========================================================================

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      if (!this.isValidEmail(normalizedEmail)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: `${env.app.url}/auth/reset-password`,
        }
      );

      if (error) {
        return {
          success: false,
          error: this.handleAuthError(error)
        };
      }

      return {
        success: true,
        data: {
          message: 'Password reset email sent. Please check your inbox.'
        }
      };

    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'Failed to send password reset email. Please try again.'
      };
    }
  }

  // ==========================================================================
  // UPDATE PASSWORD
  // ==========================================================================

  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      if (!this.isValidPassword(newPassword)) {
        return {
          success: false,
          error: `Password must be at least ${env.auth.passwordMinLength} characters long`
        };
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return {
          success: false,
          error: this.handleAuthError(error)
        };
      }

      return {
        success: true,
        data: {
          user: data.user,
          message: 'Password updated successfully'
        }
      };

    } catch (error) {
      console.error('Password update error:', error);
      return {
        success: false,
        error: 'Failed to update password. Please try again.'
      };
    }
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  async refreshSession(): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return {
          success: false,
          error: this.handleAuthError(error)
        };
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
          message: 'Session refreshed successfully'
        }
      };

    } catch (error) {
      console.error('Session refresh error:', error);
      return {
        success: false,
        error: 'Failed to refresh session'
      };
    }
  }

  async getCurrentUser(): Promise<AuthResult> {
    try {
      const { data, error }: UserResponse = await supabase.auth.getUser();

      if (error) {
        return {
          success: false,
          error: this.handleAuthError(error)
        };
      }

      return {
        success: true,
        data: {
          user: data.user
        }
      };

    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: 'Failed to get current user'
      };
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ 
          last_login: new Date().toISOString() 
        })
        .eq('id', userId);
    } catch (error) {
      // Non-critical error, just log it
      console.warn('Failed to update last login:', error);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    return password.length >= env.auth.passwordMinLength;
  }

  private handleAuthError(error: any): string {
    if (!error) return 'Unknown error occurred';

    // Handle specific Supabase auth errors
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password';
      case 'Email not confirmed':
        return 'Please verify your email address before signing in';
      case 'User already registered':
        return 'An account with this email already exists';
      case 'Password should be at least 6 characters':
        return `Password must be at least ${env.auth.passwordMinLength} characters long`;
      case 'Unable to validate email address: invalid format':
        return 'Please enter a valid email address';
      case 'Email rate limit exceeded':
        return 'Too many emails sent. Please wait before requesting another';
      case 'Signups not allowed for otp':
        return 'Account creation is temporarily disabled';
      case 'Invalid refresh token':
        return 'Session expired. Please sign in again';
      case 'Token has expired or is invalid':
        return 'Session expired. Please sign in again';
      default:
        // Log the actual error for debugging
        console.error('Auth error:', error);
        return error.message || 'An unexpected error occurred';
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const authService = AuthService.getInstance();