// useProfile Hook for Kateriss AI Video Generator
// User profile operations with optimistic updates and caching

import { useState, useCallback, useEffect } from 'react';
import { profileService } from '../services/profile';
import type { 
  UserProfile,
  ProfileUpdateData,
  AuthResult,
  UseProfileReturn,
  UserPreferences
} from '../types/auth';

// =============================================================================
// HOOK STATE INTERFACE
// =============================================================================

interface UseProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  // Action-specific loading states
  updating: boolean;
  uploadingAvatar: boolean;
  deletingAccount: boolean;
  refreshing: boolean;
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export const useProfile = (userId?: string | null): UseProfileReturn => {
  // State management
  const [state, setState] = useState<UseProfileState>({
    profile: null,
    loading: false,
    error: null,
    updating: false,
    uploadingAvatar: false,
    deletingAccount: false,
    refreshing: false,
  });

  // ==========================================================================
  // STATE UPDATERS
  // ==========================================================================

  const updateState = useCallback((updates: Partial<UseProfileState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setProfile = useCallback((profile: UserProfile | null) => {
    updateState({ profile, loading: false, error: null });
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
  // PROFILE ACTIONS
  // ==========================================================================

  const refreshProfile = useCallback(async (): Promise<AuthResult> => {
    if (!userId) {
      const error = 'User ID is required to refresh profile';
      setError(error);
      return { success: false, error };
    }

    clearError();
    updateState({ refreshing: true });

    try {
      const result = await profileService.getProfile(userId);
      
      if (result.success && result.data?.profile) {
        setProfile(result.data.profile);
      } else if (result.error) {
        setError(result.error.toString());
      }

      return result;

    } catch (error) {
      const errorMessage = 'Failed to refresh profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      updateState({ refreshing: false });
    }
  }, [userId, clearError, updateState, setProfile, setError]);

  const updateProfile = useCallback(async (updates: ProfileUpdateData): Promise<AuthResult> => {
    if (!userId) {
      const error = 'User ID is required to update profile';
      setError(error);
      return { success: false, error };
    }

    clearError();
    updateState({ updating: true });

    // Optimistic update
    const previousProfile = state.profile;
    if (previousProfile) {
      const optimisticProfile: UserProfile = {
        ...previousProfile,
        full_name: updates.full_name !== undefined ? updates.full_name : previousProfile.full_name,
        bio: updates.bio !== undefined ? updates.bio : previousProfile.bio,
        website: updates.website !== undefined ? updates.website : previousProfile.website,
        avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : previousProfile.avatar_url,
        preferences: updates.preferences !== undefined ? 
          { ...previousProfile.preferences, ...updates.preferences } : 
          previousProfile.preferences,
        updated_at: new Date().toISOString(),
      };
      setProfile(optimisticProfile);
    }

    try {
      const result = await profileService.updateProfile(userId, updates);
      
      if (result.success && result.data?.profile) {
        setProfile(result.data.profile);
      } else {
        // Revert optimistic update on error
        if (previousProfile) {
          setProfile(previousProfile);
        }
        if (result.error) {
          setError(result.error.toString());
        }
      }

      return result;

    } catch (error) {
      // Revert optimistic update on error
      if (previousProfile) {
        setProfile(previousProfile);
      }
      const errorMessage = 'Failed to update profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      updateState({ updating: false });
    }
  }, [userId, clearError, updateState, state.profile, setProfile, setError]);

  const uploadAvatar = useCallback(async (file: File): Promise<AuthResult> => {
    if (!userId) {
      const error = 'User ID is required to upload avatar';
      setError(error);
      return { success: false, error };
    }

    clearError();
    updateState({ uploadingAvatar: true });

    try {
      const result = await profileService.uploadAvatar(userId, file);
      
      if (result.success && result.data?.profile) {
        setProfile(result.data.profile);
      } else if (result.error) {
        setError(result.error.toString());
      }

      return result;

    } catch (error) {
      const errorMessage = 'Failed to upload avatar';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      updateState({ uploadingAvatar: false });
    }
  }, [userId, clearError, updateState, setProfile, setError]);

  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
    if (!userId) {
      const error = 'User ID is required to delete account';
      setError(error);
      return { success: false, error };
    }

    clearError();
    updateState({ deletingAccount: true });

    try {
      const result = await profileService.deleteProfile(userId);
      
      if (result.success) {
        // Clear profile data after successful deletion
        setProfile(null);
      } else if (result.error) {
        setError(result.error.toString());
      }

      return result;

    } catch (error) {
      const errorMessage = 'Failed to delete account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      updateState({ deletingAccount: false });
    }
  }, [userId, clearError, updateState, setProfile, setError]);

  // ==========================================================================
  // PREFERENCE HELPERS
  // ==========================================================================

  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>): Promise<AuthResult> => {
    if (!state.profile) {
      const error = 'Profile not loaded';
      setError(error);
      return { success: false, error };
    }

    return await updateProfile({ preferences });
  }, [state.profile, updateProfile, setError]);

  const updateTheme = useCallback(async (theme: UserPreferences['theme']): Promise<AuthResult> => {
    return await updatePreferences({ theme });
  }, [updatePreferences]);

  const updateNotificationSettings = useCallback(async (
    notifications: Partial<UserPreferences['notifications']>
  ): Promise<AuthResult> => {
    const currentNotifications = state.profile?.preferences?.notifications;
    return await updatePreferences({ 
      notifications: { ...currentNotifications, ...notifications } 
    });
  }, [state.profile, updatePreferences]);

  const updatePrivacySettings = useCallback(async (
    privacy: Partial<UserPreferences['privacy']>
  ): Promise<AuthResult> => {
    const currentPrivacy = state.profile?.preferences?.privacy;
    return await updatePreferences({ 
      privacy: { ...currentPrivacy, ...privacy } 
    });
  }, [state.profile, updatePreferences]);

  const updateVideoSettings = useCallback(async (
    video: Partial<UserPreferences['video']>
  ): Promise<AuthResult> => {
    const currentVideo = state.profile?.preferences?.video;
    return await updatePreferences({ 
      video: { ...currentVideo, ...video } 
    });
  }, [state.profile, updatePreferences]);

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  useEffect(() => {
    if (!userId) {
      // Clear profile if no user ID
      setProfile(null);
      return;
    }

    // Load profile on mount or when userId changes
    const loadProfile = async () => {
      setLoading(true);
      
      try {
        const result = await profileService.getProfile(userId);
        
        if (result.success && result.data?.profile) {
          setProfile(result.data.profile);
        } else if (result.error) {
          setError(result.error.toString());
        } else {
          setError('Profile not found');
        }

      } catch (error) {
        setError('Failed to load profile');
      }
    };

    loadProfile();
  }, [userId, setProfile, setError, setLoading]);

  // ==========================================================================
  // DERIVED STATE
  // ==========================================================================

  const isLoading = state.loading || state.updating || state.refreshing;
  const isUploading = state.uploadingAvatar;
  const isDeleting = state.deletingAccount;

  // ==========================================================================
  // RETURN HOOK INTERFACE
  // ==========================================================================

  return {
    // State
    profile: state.profile,
    loading: isLoading,
    error: state.error,

    // Actions
    actions: {
      updateProfile,
      uploadAvatar,
      deleteAccount,
      refreshProfile,
    },

    // Convenience methods (not in the main interface but useful)
    preferences: {
      update: updatePreferences,
      updateTheme,
      updateNotifications: updateNotificationSettings,
      updatePrivacy: updatePrivacySettings,
      updateVideo: updateVideoSettings,
    },

    // Loading states for UI
    loadingStates: {
      updating: state.updating,
      uploading: isUploading,
      deleting: isDeleting,
      refreshing: state.refreshing,
    },

    // Utilities
    utils: {
      clearError,
      hasProfile: !!state.profile,
      isProfileComplete: !!(state.profile?.full_name && state.profile?.avatar_url),
      profileCompleteness: calculateProfileCompleteness(state.profile),
    }
  };
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateProfileCompleteness(profile: UserProfile | null): number {
  if (!profile) return 0;

  let completed = 0;
  const total = 5;

  if (profile.full_name) completed++;
  if (profile.avatar_url) completed++;
  if (profile.bio) completed++;
  if (profile.website) completed++;
  if (profile.preferences) completed++;

  return Math.round((completed / total) * 100);
}

// =============================================================================
// ADDITIONAL HOOK FOR MULTIPLE PROFILES (if needed)
// =============================================================================

export const usePublicProfile = (userId: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadPublicProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await profileService.getProfile(userId);
        
        if (result.success && result.data?.profile) {
          // Filter out private information for public view
          const publicProfile: UserProfile = {
            ...result.data.profile,
            email: '', // Don't expose email in public view
            preferences: null, // Don't expose preferences
          };
          setProfile(publicProfile);
        } else {
          setError('Profile not found');
        }

      } catch (error) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadPublicProfile();
  }, [userId]);

  return { profile, loading, error };
};