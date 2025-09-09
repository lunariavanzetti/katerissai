// User Profile Service for Kateriss AI Video Generator
// Handles all profile CRUD operations with proper validation and error handling

import { supabase, type ProfileRow, type ProfileUpdate } from '../config/supabase';
import type { 
  UserProfile,
  ProfileUpdateData,
  AuthResult,
  UserPreferences
} from '../types/auth';

// =============================================================================
// PROFILE SERVICE CLASS
// =============================================================================

export class ProfileService {
  private static instance: ProfileService;

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  // ==========================================================================
  // GET PROFILE
  // ==========================================================================

  async getProfile(userId: string): Promise<AuthResult> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, this might be expected for new users
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Profile not found'
          };
        }

        console.error('Error fetching profile:', error);
        return {
          success: false,
          error: 'Failed to fetch profile data'
        };
      }

      return {
        success: true,
        data: {
          profile: this.transformProfileData(data)
        }
      };

    } catch (error) {
      console.error('Profile fetch error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while fetching profile'
      };
    }
  }

  // ==========================================================================
  // CREATE PROFILE
  // ==========================================================================

  async createProfile(userId: string, email: string, initialData?: Partial<ProfileUpdateData>): Promise<AuthResult> {
    try {
      if (!userId || !email) {
        return {
          success: false,
          error: 'User ID and email are required'
        };
      }

      const now = new Date().toISOString();
      const profileData = {
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: initialData?.full_name || null,
        avatar_url: initialData?.avatar_url || null,
        bio: initialData?.bio || null,
        website: this.validateWebsiteUrl(initialData?.website),
        created_at: now,
        updated_at: now,
        last_login: now,
        is_active: true,
        preferences: this.getDefaultPreferences(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        
        // Handle duplicate key error
        if (error.code === '23505') {
          return {
            success: false,
            error: 'Profile already exists'
          };
        }

        return {
          success: false,
          error: 'Failed to create profile'
        };
      }

      return {
        success: true,
        data: {
          profile: this.transformProfileData(data),
          message: 'Profile created successfully'
        }
      };

    } catch (error) {
      console.error('Profile creation error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while creating profile'
      };
    }
  }

  // ==========================================================================
  // UPDATE PROFILE
  // ==========================================================================

  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<AuthResult> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      // Validate and sanitize input
      const validationResult = this.validateProfileData(updates);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error
        };
      }

      const sanitizedUpdates = this.sanitizeProfileData(updates);
      
      // Add updated_at timestamp
      const profileUpdate: ProfileUpdate = {
        ...sanitizedUpdates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Profile not found'
          };
        }

        return {
          success: false,
          error: 'Failed to update profile'
        };
      }

      return {
        success: true,
        data: {
          profile: this.transformProfileData(data),
          message: 'Profile updated successfully'
        }
      };

    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while updating profile'
      };
    }
  }

  // ==========================================================================
  // DELETE PROFILE
  // ==========================================================================

  async deleteProfile(userId: string): Promise<AuthResult> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      // First, set profile to inactive instead of deleting (soft delete)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error deactivating profile:', updateError);
        return {
          success: false,
          error: 'Failed to deactivate profile'
        };
      }

      return {
        success: true,
        data: {
          message: 'Profile deactivated successfully'
        }
      };

    } catch (error) {
      console.error('Profile deletion error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while deleting profile'
      };
    }
  }

  // ==========================================================================
  // AVATAR UPLOAD
  // ==========================================================================

  async uploadAvatar(userId: string, file: File): Promise<AuthResult> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      // Validate file
      const validationResult = this.validateAvatarFile(file);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error
        };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return {
          success: false,
          error: 'Failed to upload avatar image'
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        return {
          success: false,
          error: 'Failed to get avatar URL'
        };
      }

      // Update profile with new avatar URL
      const updateResult = await this.updateProfile(userId, {
        avatar_url: urlData.publicUrl
      });

      if (!updateResult.success) {
        return updateResult;
      }

      return {
        success: true,
        data: {
          profile: updateResult.data?.profile,
          message: 'Avatar uploaded successfully'
        }
      };

    } catch (error) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while uploading avatar'
      };
    }
  }

  // ==========================================================================
  // PREFERENCES MANAGEMENT
  // ==========================================================================

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<AuthResult> {
    try {
      // Get current profile to merge preferences
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile.success || !currentProfile.data?.profile) {
        return {
          success: false,
          error: 'Profile not found'
        };
      }

      // Merge with existing preferences
      const currentPrefs = currentProfile.data.profile.preferences || this.getDefaultPreferences();
      const mergedPreferences = this.mergePreferences(currentPrefs, preferences);

      // Update profile with new preferences
      return await this.updateProfile(userId, {
        preferences: mergedPreferences
      });

    } catch (error) {
      console.error('Preferences update error:', error);
      return {
        success: false,
        error: 'Failed to update preferences'
      };
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private transformProfileData(data: ProfileRow): UserProfile {
    return {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      bio: data.bio,
      website: data.website,
      created_at: data.created_at,
      updated_at: data.updated_at,
      last_login: data.last_login,
      is_active: data.is_active,
      preferences: (data.preferences as UserPreferences) || this.getDefaultPreferences(),
    };
  }

  private validateProfileData(data: ProfileUpdateData): { valid: boolean; error?: string } {
    // Validate full name
    if (data.full_name !== undefined) {
      if (data.full_name !== null && typeof data.full_name === 'string') {
        const trimmed = data.full_name.trim();
        if (trimmed.length === 0) {
          data.full_name = null; // Empty string becomes null
        } else if (trimmed.length > 100) {
          return { valid: false, error: 'Full name must be less than 100 characters' };
        }
      }
    }

    // Validate bio
    if (data.bio !== undefined) {
      if (data.bio !== null && typeof data.bio === 'string') {
        const trimmed = data.bio.trim();
        if (trimmed.length === 0) {
          data.bio = null;
        } else if (trimmed.length > 500) {
          return { valid: false, error: 'Bio must be less than 500 characters' };
        }
      }
    }

    // Validate website
    if (data.website !== undefined && data.website !== null) {
      const validatedUrl = this.validateWebsiteUrl(data.website);
      if (!validatedUrl && data.website.trim().length > 0) {
        return { valid: false, error: 'Please enter a valid website URL' };
      }
    }

    return { valid: true };
  }

  private sanitizeProfileData(data: ProfileUpdateData): ProfileUpdateData {
    const sanitized: ProfileUpdateData = {};

    // Sanitize strings
    if (data.full_name !== undefined) {
      sanitized.full_name = data.full_name ? data.full_name.trim() : null;
    }

    if (data.bio !== undefined) {
      sanitized.bio = data.bio ? data.bio.trim() : null;
    }

    if (data.website !== undefined) {
      sanitized.website = this.validateWebsiteUrl(data.website);
    }

    if (data.avatar_url !== undefined) {
      sanitized.avatar_url = data.avatar_url;
    }

    if (data.preferences !== undefined) {
      sanitized.preferences = data.preferences;
    }

    return sanitized;
  }

  private validateWebsiteUrl(url: string | null | undefined): string | null {
    if (!url || url.trim().length === 0) {
      return null;
    }

    const trimmed = url.trim();
    
    // Add protocol if missing
    let fullUrl = trimmed;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      fullUrl = `https://${trimmed}`;
    }

    try {
      new URL(fullUrl);
      return fullUrl;
    } catch {
      return null;
    }
  }

  private validateAvatarFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Avatar must be a JPEG, PNG, or WebP image'
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Avatar file size must be less than 5MB'
      };
    }

    return { valid: true };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        marketing: false,
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showActivity: true,
      },
      video: {
        defaultQuality: '1080p',
        autoPlay: false,
        showCaptions: true,
      },
    };
  }

  private mergePreferences(current: UserPreferences, updates: Partial<UserPreferences>): UserPreferences {
    return {
      theme: updates.theme || current.theme,
      language: updates.language || current.language,
      notifications: {
        ...current.notifications,
        ...updates.notifications,
      },
      privacy: {
        ...current.privacy,
        ...updates.privacy,
      },
      video: {
        ...current.video,
        ...updates.video,
      },
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const profileService = ProfileService.getInstance();