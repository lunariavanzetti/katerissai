// =====================================================================================
// Kateriss AI Video Generator - Enhanced Supabase Client Configuration  
// Created: 2025-09-09
// Description: Advanced Supabase client with comprehensive features including
//              real-time subscriptions, storage management, and API key authentication
// =====================================================================================

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { env } from './env';
import { Database } from '../types/database';

// Legacy database interface for backward compatibility
export interface LegacyDatabase {
  // Legacy schema - kept for backward compatibility
  public: {
    Tables: {
      profiles: {
        Row: {
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
          preferences: Record<string, any> | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
          preferences?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
          preferences?: Record<string, any> | null;
        };
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          prompt: string;
          enhanced_prompt: string | null;
          settings: Record<string, any>;
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          stage: string;
          progress: number;
          estimated_time_remaining: number | null;
          video_url: string | null;
          thumbnail_url: string | null;
          preview_url: string | null;
          metadata: Record<string, any> | null;
          veo_job_id: string | null;
          cost_credits: number;
          generation_time: number | null;
          error: Record<string, any> | null;
          retry_count: number;
          max_retries: number;
          is_favorite: boolean;
          is_public: boolean;
          download_count: number;
          view_count: number;
          tags: string[];
          category: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          prompt: string;
          enhanced_prompt?: string | null;
          settings: Record<string, any>;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          stage?: string;
          progress?: number;
          estimated_time_remaining?: number | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          preview_url?: string | null;
          metadata?: Record<string, any> | null;
          veo_job_id?: string | null;
          cost_credits: number;
          generation_time?: number | null;
          error?: Record<string, any> | null;
          retry_count?: number;
          max_retries?: number;
          is_favorite?: boolean;
          is_public?: boolean;
          download_count?: number;
          view_count?: number;
          tags?: string[];
          category?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          prompt?: string;
          enhanced_prompt?: string | null;
          settings?: Record<string, any>;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          stage?: string;
          progress?: number;
          estimated_time_remaining?: number | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          preview_url?: string | null;
          metadata?: Record<string, any> | null;
          veo_job_id?: string | null;
          cost_credits?: number;
          generation_time?: number | null;
          error?: Record<string, any> | null;
          retry_count?: number;
          max_retries?: number;
          is_favorite?: boolean;
          is_public?: boolean;
          download_count?: number;
          view_count?: number;
          tags?: string[];
          category?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
      };
      video_thumbnails: {
        Row: {
          id: string;
          video_id: string;
          url: string;
          timestamp: number;
          width: number;
          height: number;
          format: string;
          file_size: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          url: string;
          timestamp: number;
          width: number;
          height: number;
          format: string;
          file_size: number;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          url?: string;
          timestamp?: number;
          width?: number;
          height?: number;
          format?: string;
          file_size?: number;
          is_default?: boolean;
          created_at?: string;
        };
      };
      user_usage: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'pro' | 'enterprise';
          credits_total: number;
          credits_used: number;
          credits_remaining: number;
          reset_date: string;
          videos_per_day_limit: number;
          videos_per_month_limit: number;
          max_duration: number;
          max_resolution: string;
          concurrent_generations: number;
          videos_today: number;
          videos_this_month: number;
          total_videos_generated: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: 'free' | 'pro' | 'enterprise';
          credits_total?: number;
          credits_used?: number;
          credits_remaining?: number;
          reset_date?: string;
          videos_per_day_limit?: number;
          videos_per_month_limit?: number;
          max_duration?: number;
          max_resolution?: string;
          concurrent_generations?: number;
          videos_today?: number;
          videos_this_month?: number;
          total_videos_generated?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: 'free' | 'pro' | 'enterprise';
          credits_total?: number;
          credits_used?: number;
          credits_remaining?: number;
          reset_date?: string;
          videos_per_day_limit?: number;
          videos_per_month_limit?: number;
          max_duration?: number;
          max_resolution?: string;
          concurrent_generations?: number;
          videos_today?: number;
          videos_this_month?: number;
          total_videos_generated?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// =====================================================================================
// CLIENT CONFIGURATION
// =====================================================================================

// Enhanced Supabase client configuration options
const supabaseOptions = {
  auth: {
    // Enable auto refresh tokens
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session in URL hash
    detectSessionInUrl: true,
    // Custom storage for session persistence
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Flow type for PKCE (recommended for web apps)
    flowType: 'pkce' as const,
    // Redirect URL for OAuth
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
  },
  // Global headers
  global: {
    headers: {
      'X-Client-Info': 'kateriss-ai-video-generator',
      'X-Client-Version': '2.0.0',
    },
  },
  // Database schema
  db: {
    schema: 'public',
  },
  // Real-time configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
};

// Create enhanced Supabase client with full database types
export const supabase: SupabaseClient<Database> = createClient(
  env.supabase.url,
  env.supabase.anonKey,
  supabaseOptions
);

// Create service role client for admin operations (if needed)
export const supabaseAdmin = env.supabase.serviceRoleKey ? createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    ...supabaseOptions,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
) : null;

// =====================================================================================
// REAL-TIME SUBSCRIPTIONS MANAGEMENT
// =====================================================================================

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to video status updates for a specific user
   */
  subscribeToUserVideos(userId: string, callback: (payload: any) => void) {
    const channelName = `user-videos-${userId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to generation queue updates
   */
  subscribeToGenerationQueue(callback: (payload: any) => void) {
    const channelName = 'generation-queue';
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_generations',
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to usage updates for a specific user
   */
  subscribeToUserUsage(userId: string, callback: (payload: any) => void) {
    const channelName = `user-usage-${userId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usage',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const realtimeManager = new RealtimeManager();

// =====================================================================================
// STORAGE HELPERS
// =====================================================================================

export const storageHelpers = {
  /**
   * Upload video file to storage
   */
  async uploadVideo(
    file: File,
    userId: string,
    videoId: string,
    options?: { onProgress?: (progress: number) => void }
  ) {
    const fileExt = file.name.split('.').pop() || 'mp4';
    const fileName = `${new Date().getFullYear()}/${userId}/${videoId}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName);

    return { data, publicUrl };
  },

  /**
   * Upload thumbnail to storage
   */
  async uploadThumbnail(
    file: File,
    userId: string,
    videoId: string,
    thumbnailId: string
  ) {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${new Date().getFullYear()}/${userId}/${videoId}/${thumbnailId}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    return { data, publicUrl };
  },

  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File, userId: string) {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return { data, publicUrl };
  },

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, fileName: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) throw error;
  },

  /**
   * Get signed URL for private files
   */
  async getSignedUrl(bucket: string, fileName: string, expiresIn: number = 3600) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, expiresIn);

    if (error) throw error;
    return data;
  },
};

// =====================================================================================
// API KEY AUTHENTICATION
// =====================================================================================

export const apiKeyAuth = {
  /**
   * Create authenticated client using API key
   */
  createApiKeyClient(apiKey: string): SupabaseClient<Database> {
    return createClient(
      env.supabase.url,
      env.supabase.anonKey,
      {
        ...supabaseOptions,
        global: {
          headers: {
            ...supabaseOptions.global.headers,
            'X-API-Key': apiKey,
          },
        },
      }
    );
  },

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const keyHash = await this.hashApiKey(apiKey);
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('user_id, is_active, expires_at')
        .eq('key_hash', keyHash)
        .single();

      if (error || !data) {
        return { valid: false };
      }

      const isActive = data.is_active;
      const isNotExpired = !data.expires_at || new Date(data.expires_at) > new Date();

      return {
        valid: isActive && isNotExpired,
        userId: data.user_id,
      };
    } catch (error) {
      console.error('API key validation error:', error);
      return { valid: false };
    }
  },

  /**
   * Hash API key for storage (client-side utility)
   */
  async hashApiKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
};

// =====================================================================================
// ENHANCED AUTH EVENT HANDLING
// =====================================================================================

// Auth event callbacks
type AuthEventCallback = (event: string, session: any) => void;
const authEventCallbacks: AuthEventCallback[] = [];

// Register auth event callback
export const onAuthEvent = (callback: AuthEventCallback) => {
  authEventCallbacks.push(callback);
  return () => {
    const index = authEventCallbacks.indexOf(callback);
    if (index > -1) {
      authEventCallbacks.splice(index, 1);
    }
  };
};

// Enhanced auth event listeners setup
supabase.auth.onAuthStateChange(async (event, session) => {
  // Log auth events in development
  if (env.app.environment === 'development') {
    console.log('🔐 Auth Event:', event, session?.user?.email);
  }

  // Handle different auth events
  switch (event) {
    case 'SIGNED_IN':
      console.log('✅ User signed in:', session?.user?.email);
      
      // Update user's last login
      if (session?.user?.id) {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', session.user.id);
      }
      
      // Initialize user usage if needed
      if (session?.user?.id) {
        await initializeUserIfNeeded(session.user.id);
      }
      break;
      
    case 'SIGNED_OUT':
      console.log('👋 User signed out');
      // Clean up real-time subscriptions
      realtimeManager.unsubscribeAll();
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear any app-specific cache
        sessionStorage.clear();
      }
      break;
      
    case 'PASSWORD_RECOVERY':
      console.log('🔑 Password recovery initiated');
      break;
      
    case 'TOKEN_REFRESHED':
      if (env.app.environment === 'development') {
        console.log('🔄 Auth token refreshed');
      }
      break;
      
    case 'USER_UPDATED':
      console.log('📝 User profile updated');
      break;
  }

  // Call registered callbacks
  authEventCallbacks.forEach(callback => {
    try {
      callback(event, session);
    } catch (error) {
      console.error('Auth event callback error:', error);
    }
  });
});

// Initialize user if they don't exist in profiles table
async function initializeUserIfNeeded(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, trigger profile creation
      console.log('Initializing new user profile...');
      // The database trigger should handle this, but we can also call the function
      await supabase.rpc('initialize_user_usage', {
        user_id: userId,
        plan: 'pay-per-video'
      });
    }
  } catch (error) {
    console.error('Error initializing user:', error);
  }
}

// =====================================================================================
// ENHANCED AUTH HELPERS
// =====================================================================================

// Helper function to get current session with caching
let cachedSession: any = null;
let sessionCacheTime = 0;
const SESSION_CACHE_DURATION = 5000; // 5 seconds

export const getCurrentSession = async (useCache = true) => {
  try {
    // Use cache if available and not expired
    if (useCache && cachedSession && Date.now() - sessionCacheTime < SESSION_CACHE_DURATION) {
      return cachedSession;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    // Update cache
    cachedSession = session;
    sessionCacheTime = Date.now();
    
    return session;
  } catch (error) {
    console.error('Unexpected error getting session:', error);
    return null;
  }
};

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Unexpected error getting user:', error);
    return null;
  }
};

// Helper function to get current user with profile data
export const getCurrentUserProfile = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error getting user profile:', error);
      return { user, profile: null };
    }

    return { user, profile };
  } catch (error) {
    console.error('Unexpected error getting user profile:', error);
    return null;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return !!session?.user;
};

// Helper function to check user subscription status
export const getUserSubscriptionStatus = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_id')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    // Get active subscription details
    if (profile.subscription_id) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', profile.subscription_id)
        .eq('status', 'active')
        .single();

      return {
        tier: profile.subscription_tier,
        subscription: subscription,
        isActive: !!subscription
      };
    }

    return {
      tier: profile.subscription_tier,
      subscription: null,
      isActive: profile.subscription_tier === 'pay-per-video'
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
};

// Helper function to sign out from all sessions
export const signOutEverywhere = async () => {
  try {
    // Clear cache
    cachedSession = null;
    sessionCacheTime = 0;
    
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
      console.error('Error signing out:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Unexpected error signing out:', error);
    return false;
  }
};

// Helper function to refresh session
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
    
    // Update cache
    cachedSession = data.session;
    sessionCacheTime = Date.now();
    
    return true;
  } catch (error) {
    console.error('Unexpected error refreshing session:', error);
    return false;
  }
};

// Helper to check if user has specific permissions
export const hasPermission = async (permission: string): Promise<boolean> => {
  try {
    const userProfile = await getCurrentUserProfile();
    if (!userProfile?.profile) return false;

    // Check if user is admin
    const isAdmin = userProfile.user?.user_metadata?.role === 'admin';
    if (isAdmin) return true;

    // Check subscription-based permissions
    const { tier } = userProfile.profile;
    
    switch (permission) {
      case 'create_video':
        return true; // All users can create videos
      case 'unlimited_videos':
        return tier === 'premium';
      case 'api_access':
        return tier === 'premium';
      case 'priority_support':
        return tier === 'premium';
      case 'commercial_license':
        return tier === 'premium';
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// =====================================================================================
// EXPORTS AND TYPE DEFINITIONS
// =====================================================================================

// Export types
export type { SupabaseClient, RealtimeChannel };
export type SupabaseDatabase = Database;
export type EnhancedDatabase = Database;

// Re-export all types from database.ts
export * from '../types/database';

// Legacy types for backward compatibility  
export type ProfileRow = LegacyDatabase['public']['Tables']['profiles']['Row'];
export type ProfileInsert = LegacyDatabase['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = LegacyDatabase['public']['Tables']['profiles']['Update'];

export type VideoRow = LegacyDatabase['public']['Tables']['videos']['Row'];
export type VideoInsert = LegacyDatabase['public']['Tables']['videos']['Insert'];
export type VideoUpdate = LegacyDatabase['public']['Tables']['videos']['Update'];

export type VideoThumbnailRow = LegacyDatabase['public']['Tables']['video_thumbnails']['Row'];
export type VideoThumbnailInsert = LegacyDatabase['public']['Tables']['video_thumbnails']['Insert'];
export type VideoThumbnailUpdate = LegacyDatabase['public']['Tables']['video_thumbnails']['Update'];

export type UserUsageRow = LegacyDatabase['public']['Tables']['user_usage']['Row'];
export type UserUsageInsert = LegacyDatabase['public']['Tables']['user_usage']['Insert'];
export type UserUsageUpdate = LegacyDatabase['public']['Tables']['user_usage']['Update'];

// Enhanced client interface
export interface EnhancedSupabaseClient extends SupabaseClient<Database> {
  realtime: typeof realtimeManager;
  storage: typeof storageHelpers;
  apiKey: typeof apiKeyAuth;
}

// Create enhanced client wrapper
export const createEnhancedClient = (): EnhancedSupabaseClient => {
  return Object.assign(supabase, {
    realtime: realtimeManager,
    storage: storageHelpers,
    apiKey: apiKeyAuth,
  }) as EnhancedSupabaseClient;
};

// Default enhanced client export
export const enhancedSupabase = createEnhancedClient();

// Export the basic client as default for compatibility
export default supabase;