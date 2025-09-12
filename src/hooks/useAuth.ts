// useAuth Hook for Kateriss AI Video Generator
// Complete auth state management with React Query integration

import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { authService } from '../services/auth';
import { profileService } from '../services/profile';
import type { 
  AuthState,
  SignUpCredentials,
  SignInCredentials,
  AuthResult,
  AuthProvider,
  UserProfile,
  UseAuthReturn
} from '../types/auth';

// =============================================================================
// HOOK STATE INTERFACE
// =============================================================================

interface UseAuthState extends AuthState {
  // Additional loading states for specific actions
  signingIn: boolean;
  signingUp: boolean;
  signingOut: boolean;
  resettingPassword: boolean;
  updatingPassword: boolean;
  refreshingSession: boolean;
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export const useAuth = (): UseAuthReturn => {
  // State management
  const [state, setState] = useState<UseAuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isEmailConfirmed: false,
    // Action-specific loading states
    signingIn: false,
    signingUp: false,
    signingOut: false,
    resettingPassword: false,
    updatingPassword: false,
    refreshingSession: false,
  });

  // Use ref to track initialization to prevent loops
  const initialized = useRef(false);

  // ==========================================================================
  // STATE UPDATERS
  // ==========================================================================

  const updateState = useCallback((updates: Partial<UseAuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setAuthData = useCallback((user: User | null, session: Session | null, profile: UserProfile | null = null) => {
    const isAuthenticated = !!user && !!session;
    const isEmailConfirmed = user?.email_confirmed_at ? true : false;

    updateState({
      user,
      session,
      profile,
      isAuthenticated,
      isEmailConfirmed,
      loading: false,
      error: null,
    });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error, loading: false });
  }, [updateState]);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ loading });
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // ==========================================================================
  // PROFILE MANAGEMENT
  // ==========================================================================

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile loading timeout')), 5000);
      });

      const profilePromise = profileService.getProfile(userId);
      const result = await Promise.race([profilePromise, timeoutPromise]) as Awaited<ReturnType<typeof profileService.getProfile>>;
      
      if (result.success && result.data?.profile) {
        updateState({ profile: result.data.profile });
      } else {
        // Profile might not exist yet, attempt to create it
        const user = state.user;
        if (user?.email) {
          const createPromise = profileService.createProfile(userId, user.email, {
            full_name: user.user_metadata?.full_name || null,
          });
          const createResult = await Promise.race([createPromise, timeoutPromise]) as Awaited<ReturnType<typeof profileService.createProfile>>;
          
          if (createResult.success && createResult.data?.profile) {
            updateState({ profile: createResult.data.profile });
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Don't set error state for profile loading failures
      // Instead, continue without profile to prevent infinite loading
      updateState({ profile: null });
    }
  }, [state.user, updateState]);

  // ==========================================================================
  // AUTH ACTIONS
  // ==========================================================================

  const signUp = useCallback(async (credentials: SignUpCredentials): Promise<AuthResult> => {
    clearError();
    updateState({ signingUp: true });

    try {
      const result = await authService.signUp(credentials);
      
      if (result.success && result.data?.user && result.data?.session) {
        setAuthData(result.data.user, result.data.session);
        
        // Load or create profile
        if (result.data.user.id) {
          await loadUserProfile(result.data.user.id);
        }
      } else if (result.error) {
        setError(result.error.toString());
      }

      return result;

    } catch (error) {
      const errorMessage = 'An unexpected error occurred during signup';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      updateState({ signingUp: false });
    }
  }, [clearError, updateState, setAuthData, setError, loadUserProfile]);

  const signIn = useCallback(async (credentials: SignInCredentials): Promise<AuthResult> => {
    clearError();
    updateState({ signingIn: true });

    try {
      const result = await authService.signIn(credentials);
      
      if (result.success && result.data?.user && result.data?.session) {
        setAuthData(result.data.user, result.data.session);
        
        // Load user profile
        if (result.data.user.id) {
          await loadUserProfile(result.data.user.id);
        }
      } else if (result.error) {
        setError(result.error.toString());
      }

      return result;

    } catch (error) {
      const errorMessage = 'An unexpected error occurred during sign in';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      updateState({ signingIn: false });
    }
  }, [clearError, updateState, setAuthData, setError, loadUserProfile]);

  const signInWithProvider = useCallback(async (provider: AuthProvider): Promise<AuthResult> => {
    clearError();
    updateState({ signingIn: true });

    try {
      const result = await authService.signInWithProvider(provider);
      
      // For OAuth, the actual sign-in happens via redirect
      // So we don't update state here, just handle errors
      if (!result.success && result.error) {
        setError(result.error.toString());
      }

      return result;

    } catch (error) {
      const errorMessage = `Failed to sign in with ${provider}`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      updateState({ signingIn: false });
    }
  }, [clearError, updateState, setError]);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    clearError();
    updateState({ signingOut: true });

    try {
      const result = await authService.signOut();
      
      if (result.success) {
        // Clear all auth state
        setAuthData(null, null, null);
      } else if (result.error) {
        setError(result.error.toString());
      }

      return result;

    } catch (error) {
      const errorMessage = 'An unexpected error occurred during sign out';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      updateState({ signingOut: false });
    }
  }, [clearError, updateState, setAuthData, setError]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    clearError();
    updateState({ resettingPassword: true });

    try {
      const result = await authService.resetPassword(email);
      
      if (!result.success && result.error) {
        setError(result.error.toString());
      }

      return result;

    } catch (error) {
      const errorMessage = 'Failed to send password reset email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      updateState({ resettingPassword: false });
    }
  }, [clearError, updateState, setError]);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    clearError();
    updateState({ updatingPassword: true });

    try {
      const result = await authService.updatePassword(password);
      
      if (result.success && result.data?.user) {
        updateState({ user: result.data.user });
      } else if (result.error) {
        setError(result.error.toString());
      }

      return result;

    } catch (error) {
      const errorMessage = 'Failed to update password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      updateState({ updatingPassword: false });
    }
  }, [clearError, updateState, setError]);

  const refreshSession = useCallback(async (): Promise<AuthResult> => {
    updateState({ refreshingSession: true });

    try {
      const result = await authService.refreshSession();
      
      if (result.success && result.data?.user && result.data?.session) {
        setAuthData(result.data.user, result.data.session, state.profile);
      } else if (result.error) {
        // Session refresh failed, sign out
        setAuthData(null, null, null);
      }

      return result;

    } catch (error) {
      setAuthData(null, null, null);
      return { success: false, error: 'Session refresh failed' };
    } finally {
      updateState({ refreshingSession: false });
    }
  }, [updateState, setAuthData, state.profile]);

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      if (initialized.current) return;
      initialized.current = true;

      try {
        setLoading(true);
        
        // Add overall timeout for initialization
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth initialization timeout')), 8000);
        });

        const initPromise = async () => {
          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session initialization error:', error);
            if (mounted) {
              setError('Failed to initialize authentication');
            }
            return;
          }

          if (session?.user && mounted) {
            setAuthData(session.user, session);
            
            // Load user profile inline (with timeout)
            try {
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Profile loading timeout')), 5000);
              });

              const profilePromise = profileService.getProfile(session.user.id);
              const result = await Promise.race([profilePromise, timeoutPromise]) as Awaited<ReturnType<typeof profileService.getProfile>>;
              
              if (result.success && result.data?.profile) {
                updateState({ profile: result.data.profile });
              } else {
                // Profile might not exist yet, attempt to create it
                if (session.user.email) {
                  const createPromise = profileService.createProfile(session.user.id, session.user.email, {
                    full_name: session.user.user_metadata?.full_name || null,
                  });
                  const createResult = await Promise.race([createPromise, timeoutPromise]) as Awaited<ReturnType<typeof profileService.createProfile>>;
                  
                  if (createResult.success && createResult.data?.profile) {
                    updateState({ profile: createResult.data.profile });
                  }
                }
              }
            } catch (profileError) {
              console.warn('Profile loading failed during init:', profileError);
              // Continue without profile to prevent infinite loading
              updateState({ profile: null });
            }
          } else if (mounted) {
            setLoading(false);
          }
        };

        await Promise.race([initPromise(), timeoutPromise]);

      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          // If it's a timeout or any error, continue without profile
          setLoading(false);
          if (error instanceof Error && error.message.includes('timeout')) {
            console.warn('Auth initialization timed out, continuing without profile');
          } else {
            setError('Failed to initialize authentication');
          }
        }
      }
    };

    initializeAuth();

    // Failsafe: Force loading to stop after 12 seconds no matter what
    const failsafeTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Failsafe: Force stopping loading after 12 seconds');
        setLoading(false);
      }
    }, 12000);

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.email);

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              setAuthData(session.user, session);
              // Profile loading is handled by the initialization above
              console.log('User signed in, profile will be loaded by initialization');
            }
            break;

          case 'SIGNED_OUT':
            setAuthData(null, null, null);
            break;

          case 'TOKEN_REFRESHED':
            if (session?.user) {
              setAuthData(session.user, session, state.profile);
            }
            break;

          case 'USER_UPDATED':
            if (session?.user) {
              updateState({ user: session.user });
              // Don't reload profile on user update to avoid loops
              console.log('User updated, keeping existing profile');
            }
            break;

          case 'PASSWORD_RECOVERY':
            // Handle password recovery if needed
            break;

          default:
            break;
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(failsafeTimeout);
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - this should only run once

  // ==========================================================================
  // SESSION MONITORING
  // ==========================================================================

  useEffect(() => {
    if (!state.session) return;

    // Check session expiry periodically
    const checkSession = async () => {
      const now = new Date().getTime();
      const expiresAt = state.session!.expires_at! * 1000;
      const timeUntilExpiry = expiresAt - now;

      // Refresh session if it expires in the next 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        await refreshSession();
      } else if (timeUntilExpiry <= 0) {
        // Session expired, sign out
        await signOut();
      }
    };

    // Check every minute
    const interval = setInterval(checkSession, 60 * 1000);

    return () => clearInterval(interval);
  }, [state.session, refreshSession, signOut]);

  // ==========================================================================
  // RETURN HOOK INTERFACE
  // ==========================================================================

  // Debug logging to identify auth state issues
  console.log('🔐 Auth Hook State:', {
    hasUser: !!state.user,
    userId: state.user?.id,
    email: state.user?.email,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading || state.signingIn || state.signingUp,
    hasSession: !!state.session
  });

  return {
    // State
    user: state.user,
    session: state.session,
    profile: state.profile,
    loading: state.loading || state.signingIn || state.signingUp,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    isEmailConfirmed: state.isEmailConfirmed,

    // Actions
    actions: {
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      signInWithProvider,
      refreshSession,
      clearError,
    }
  };
};