// Authentication Type Definitions for Kateriss AI Video Generator
// Comprehensive types for all auth-related functionality

import { User, Session, AuthError } from '@supabase/supabase-js';
import { ProfileRow } from '../config/supabase';

// =============================================================================
// AUTH STATE TYPES
// =============================================================================

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isEmailConfirmed: boolean;
}

export interface AuthContextType extends AuthState {
  signUp: (credentials: SignUpCredentials) => Promise<AuthResult>;
  signIn: (credentials: SignInCredentials) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signInWithProvider: (provider: AuthProvider) => Promise<AuthResult>;
  refreshSession: () => Promise<AuthResult>;
  clearError: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<AuthResult>;
}

// =============================================================================
// CREDENTIAL TYPES
// =============================================================================

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
  termsAccepted: boolean;
  marketingConsent?: boolean;
}

export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface PasswordResetCredentials {
  email: string;
}

export interface UpdatePasswordCredentials {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

// =============================================================================
// USER PROFILE TYPES
// =============================================================================

export interface UserProfile extends Omit<ProfileRow, 'id'> {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
  preferences: UserPreferences | null;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de';
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showEmail: boolean;
    showActivity: boolean;
  };
  video: {
    defaultQuality: '720p' | '1080p' | '4k';
    autoPlay: boolean;
    showCaptions: boolean;
  };
}

export interface ProfileUpdateData {
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  website?: string | null;
  preferences?: Partial<UserPreferences>;
}

// =============================================================================
// AUTH PROVIDER TYPES
// =============================================================================

export type AuthProvider = 
  | 'google'
  | 'github'
  | 'apple'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'discord';

export interface ProviderConfig {
  name: AuthProvider;
  displayName: string;
  icon: string;
  enabled: boolean;
  scopes?: string[];
  redirectTo?: string;
}

// =============================================================================
// AUTH RESULT TYPES
// =============================================================================

export interface AuthResult {
  success: boolean;
  error?: AuthError | Error | string | null;
  data?: {
    user?: User | null;
    session?: Session | null;
    profile?: UserProfile | null;
    message?: string;
  };
}

export interface AuthActionResult<T = any> {
  loading: boolean;
  error: string | null;
  data: T | null;
  execute: (...args: any[]) => Promise<AuthResult>;
  reset: () => void;
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationRules {
  email: {
    required: boolean;
    pattern: RegExp;
    message: string;
  };
  password: {
    required: boolean;
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    message: string;
  };
  fullName: {
    required: boolean;
    minLength: number;
    maxLength: number;
    message: string;
  };
}

export interface FormErrors {
  [key: string]: string | undefined;
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  currentPassword?: string;
  newPassword?: string;
  terms?: string;
  general?: string;
}

// =============================================================================
// SESSION MANAGEMENT TYPES
// =============================================================================

export interface SessionInfo {
  user: User;
  session: Session;
  profile: UserProfile | null;
  expiresAt: Date;
  refreshToken: string;
  isExpired: boolean;
  timeUntilExpiry: number; // milliseconds
}

export interface LoginAttempt {
  email: string;
  timestamp: Date;
  successful: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecuritySettings {
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  sessionTimeout: number; // minutes
  requireEmailVerification: boolean;
  enable2FA: boolean;
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

export interface AuthFormProps {
  onSuccess?: (result: AuthResult) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  className?: string;
  showSocialLogin?: boolean;
  showRememberMe?: boolean;
}

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireEmailVerification?: boolean;
  requiredRole?: string;
}

export interface ProfileSettingsProps {
  onProfileUpdate?: (profile: UserProfile) => void;
  onError?: (error: string) => void;
  showDangerZone?: boolean;
  className?: string;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

export type AuthEventType = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT' 
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'USER_DELETED';

export interface AuthEvent {
  type: AuthEventType;
  user?: User | null;
  session?: Session | null;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

export interface UseAuthReturn extends AuthState {
  actions: {
    signUp: (credentials: SignUpCredentials) => Promise<AuthResult>;
    signIn: (credentials: SignInCredentials) => Promise<AuthResult>;
    signOut: () => Promise<AuthResult>;
    resetPassword: (email: string) => Promise<AuthResult>;
    updatePassword: (password: string) => Promise<AuthResult>;
    signInWithProvider: (provider: AuthProvider) => Promise<AuthResult>;
    refreshSession: () => Promise<AuthResult>;
    clearError: () => void;
  };
}

export interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  actions: {
    updateProfile: (updates: ProfileUpdateData) => Promise<AuthResult>;
    uploadAvatar: (file: File) => Promise<AuthResult>;
    deleteAccount: () => Promise<AuthResult>;
    refreshProfile: () => Promise<AuthResult>;
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type AuthLoadingState = 
  | 'idle'
  | 'loading'
  | 'authenticating'
  | 'refreshing'
  | 'signing-out'
  | 'updating-profile'
  | 'error';

export interface AuthErrorDetails {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  context?: 'sign-in' | 'sign-up' | 'password-reset' | 'profile-update' | 'session-refresh';
}

// Default validation rules
export const DEFAULT_VALIDATION_RULES: ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
  },
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'Full name must be between 2 and 50 characters'
  }
};