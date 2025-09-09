// Auth Context Provider for Kateriss AI Video Generator
// Provides authentication state and actions throughout the app

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/ui';
import type { AuthContextType } from '../types/auth';

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const AuthContext = createContext<AuthContextType | null>(null);

// =============================================================================
// PROVIDER PROPS INTERFACE
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
  enableLoadingScreen?: boolean;
}

// =============================================================================
// AUTH PROVIDER COMPONENT
// =============================================================================

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  fallback,
  enableLoadingScreen = true 
}) => {
  const auth = useAuth();

  // Show loading screen during initial auth check
  if (auth.loading && enableLoadingScreen) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-6">
          <div className="brutal-card-pink p-8 mx-4">
            <Loading 
              variant="spinner" 
              size="lg" 
              className="mb-4"
            />
            <h2 className="text-xl font-bold uppercase tracking-wide text-black mb-2">
              Loading Kateriss AI
            </h2>
            <p className="text-gray-600 text-sm">
              Initializing your creative workspace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Create context value with all auth state and actions
  const contextValue: AuthContextType = {
    // Auth state
    user: auth.user,
    session: auth.session,
    profile: auth.profile,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    isEmailConfirmed: auth.isEmailConfirmed,

    // Auth actions
    signUp: auth.actions.signUp,
    signIn: auth.actions.signIn,
    signOut: auth.actions.signOut,
    resetPassword: auth.actions.resetPassword,
    updatePassword: auth.actions.updatePassword,
    signInWithProvider: auth.actions.signInWithProvider,
    refreshSession: auth.actions.refreshSession,
    clearError: auth.actions.clearError,

    // Profile management
    updateProfile: async (updates) => {
      // This will be handled by useProfile hook in components
      // For now, return success to maintain interface compatibility
      return { success: true };
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// =============================================================================
// HOOK TO USE AUTH CONTEXT
// =============================================================================

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error(
      'useAuthContext must be used within an AuthProvider. ' +
      'Make sure you have wrapped your app with <AuthProvider>.'
    );
  }
  
  return context;
};

// =============================================================================
// AUTH STATUS HOOK
// =============================================================================

export const useAuthStatus = () => {
  const { isAuthenticated, isEmailConfirmed, user, loading } = useAuthContext();
  
  return {
    isAuthenticated,
    isEmailConfirmed,
    isGuest: !isAuthenticated,
    needsEmailVerification: isAuthenticated && !isEmailConfirmed,
    hasProfile: !!user,
    loading,
    // Computed statuses
    canAccessApp: isAuthenticated && isEmailConfirmed,
    shouldShowVerificationPrompt: isAuthenticated && !isEmailConfirmed,
    shouldRedirectToLogin: !isAuthenticated && !loading,
  };
};

// =============================================================================
// AUTH USER HOOK
// =============================================================================

export const useAuthUser = () => {
  const { user, profile, loading, error } = useAuthContext();
  
  return {
    user,
    profile,
    loading,
    error,
    // User properties
    userId: user?.id || null,
    email: user?.email || null,
    fullName: profile?.full_name || user?.user_metadata?.full_name || null,
    avatarUrl: profile?.avatar_url || null,
    isEmailConfirmed: !!user?.email_confirmed_at,
    createdAt: user?.created_at ? new Date(user.created_at) : null,
    lastSignIn: user?.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
    
    // Profile properties
    bio: profile?.bio || null,
    website: profile?.website || null,
    preferences: profile?.preferences || null,
    isProfileComplete: !!(profile?.full_name && profile?.avatar_url),
  };
};

// =============================================================================
// AUTH ACTIONS HOOK
// =============================================================================

export const useAuthActions = () => {
  const { 
    signUp, 
    signIn, 
    signOut, 
    resetPassword, 
    updatePassword,
    signInWithProvider,
    refreshSession,
    clearError
  } = useAuthContext();
  
  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    signInWithProvider,
    refreshSession,
    clearError,
    
    // Convenience methods
    signInWithGoogle: () => signInWithProvider('google'),
    signInWithGitHub: () => signInWithProvider('github'),
    signInWithApple: () => signInWithProvider('apple'),
    
    // Sign out with confirmation
    signOutWithConfirmation: async () => {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        return await signOut();
      }
      return { success: false, error: 'Sign out cancelled' };
    },
  };
};

// =============================================================================
// HIGHER-ORDER COMPONENT FOR AUTHENTICATION
// =============================================================================

interface WithAuthProps {
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
}

export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthProps = {}
) => {
  const {
    requireAuth = false,
    requireEmailVerification = false,
    redirectTo = '/auth/login',
    fallback = null
  } = options;

  const WithAuthComponent: React.FC<P> = (props) => {
    const { isAuthenticated, isEmailConfirmed, loading } = useAuthStatus();

    // Show loading state
    if (loading) {
      return fallback || (
        <div className="flex items-center justify-center min-h-64">
          <Loading variant="spinner" size="lg" />
        </div>
      );
    }

    // Check authentication requirements
    if (requireAuth && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      return fallback || (
        <div className="text-center py-8">
          <p>Redirecting to login...</p>
        </div>
      );
    }

    // Check email verification requirements
    if (requireEmailVerification && isAuthenticated && !isEmailConfirmed) {
      return fallback || (
        <div className="text-center py-8 space-y-4">
          <div className="brutal-card-pink p-6 mx-auto max-w-md">
            <h2 className="text-lg font-bold uppercase text-black mb-2">
              Email Verification Required
            </h2>
            <p className="text-gray-600 text-sm">
              Please check your email and click the verification link to continue.
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAuthComponent;
};

// =============================================================================
// AUTH ERROR BOUNDARY
// =============================================================================

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  AuthErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="brutal-card p-8 mx-4 max-w-md">
            <h2 className="text-xl font-bold uppercase tracking-wide text-black mb-4">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-6">
              Something went wrong with the authentication system. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary w-full"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { AuthContext };
export type { AuthProviderProps, WithAuthProps };