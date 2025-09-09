// =====================================================================================
// Kateriss AI Video Generator - Comprehensive Database Types
// Created: 2025-09-09
// Description: Complete TypeScript types for all database tables, views, functions,
//              and enums with full type safety for the entire application
// =====================================================================================

// =============================================================================
// ENUMS
// =============================================================================

export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'paused'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'canceled' | 'refunded' | 'partially_refunded'
export type PaymentType = 'subscription' | 'one-time' | 'upgrade' | 'downgrade' | 'refund'
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
export type PricingTier = 'pay-per-video' | 'basic' | 'premium'
export type UsageEventType = 'video_generated' | 'subscription_reset' | 'upgrade' | 'downgrade'

// =============================================================================
// DATABASE INTERFACE
// =============================================================================

export interface Database {
  public: {
    Tables: {
      // Profiles table
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          subscription_tier: PricingTier
          subscription_id: string | null
          api_key_hash: string | null
          api_key_created_at: string | null
          preferences: Record<string, any> | null
          onboarding_completed: boolean
          last_login: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          subscription_tier?: PricingTier
          subscription_id?: string | null
          api_key_hash?: string | null
          api_key_created_at?: string | null
          preferences?: Record<string, any> | null
          onboarding_completed?: boolean
          last_login?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          subscription_tier?: PricingTier
          subscription_id?: string | null
          api_key_hash?: string | null
          api_key_created_at?: string | null
          preferences?: Record<string, any> | null
          onboarding_completed?: boolean
          last_login?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // Subscriptions table
      subscriptions: {
        Row: {
          id: string
          user_id: string
          paddle_subscription_id: string
          paddle_plan_id: string
          status: SubscriptionStatus
          plan: PricingTier
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          paddle_subscription_id: string
          paddle_plan_id: string
          status?: SubscriptionStatus
          plan: PricingTier
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          paddle_subscription_id?: string
          paddle_plan_id?: string
          status?: SubscriptionStatus
          plan?: PricingTier
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }

      // Payments table
      payments: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          paddle_order_id: string
          paddle_checkout_id: string | null
          amount: number
          currency: string
          status: PaymentStatus
          type: PaymentType
          description: string
          video_count: number | null
          receipt_url: string | null
          metadata: Record<string, any> | null
          created_at: string
          paid_at: string | null
          refunded_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          paddle_order_id: string
          paddle_checkout_id?: string | null
          amount: number
          currency?: string
          status?: PaymentStatus
          type?: PaymentType
          description: string
          video_count?: number | null
          receipt_url?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
          paid_at?: string | null
          refunded_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          paddle_order_id?: string
          paddle_checkout_id?: string | null
          amount?: number
          currency?: string
          status?: PaymentStatus
          type?: PaymentType
          description?: string
          video_count?: number | null
          receipt_url?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
          paid_at?: string | null
          refunded_at?: string | null
        }
      }

      // Usage table
      usage: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          plan: PricingTier
          period_start: string
          period_end: string
          videos_generated: number
          videos_limit: number | null
          credits_used: number
          credits_total: number
          overage_videos: number
          overage_charges: number
          reset_date: string
          last_reset: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          plan: PricingTier
          period_start: string
          period_end: string
          videos_generated?: number
          videos_limit?: number | null
          credits_used?: number
          credits_total?: number
          overage_videos?: number
          overage_charges?: number
          reset_date: string
          last_reset?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          plan?: PricingTier
          period_start?: string
          period_end?: string
          videos_generated?: number
          videos_limit?: number | null
          credits_used?: number
          credits_total?: number
          overage_videos?: number
          overage_charges?: number
          reset_date?: string
          last_reset?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // Videos table
      videos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          prompt: string
          enhanced_prompt: string | null
          settings: Record<string, any>
          status: VideoStatus
          stage: string
          progress: number
          estimated_time_remaining: number | null
          video_url: string | null
          thumbnail_url: string | null
          preview_url: string | null
          duration: number | null
          resolution: string
          file_size: number | null
          format: string
          metadata: Record<string, any> | null
          veo_job_id: string | null
          cost_credits: number
          generation_time: number | null
          error: Record<string, any> | null
          retry_count: number
          max_retries: number
          is_favorite: boolean
          is_public: boolean
          download_count: number
          view_count: number
          tags: string[]
          category: string | null
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          prompt: string
          enhanced_prompt?: string | null
          settings?: Record<string, any>
          status?: VideoStatus
          stage?: string
          progress?: number
          estimated_time_remaining?: number | null
          video_url?: string | null
          thumbnail_url?: string | null
          preview_url?: string | null
          duration?: number | null
          resolution?: string
          file_size?: number | null
          format?: string
          metadata?: Record<string, any> | null
          veo_job_id?: string | null
          cost_credits?: number
          generation_time?: number | null
          error?: Record<string, any> | null
          retry_count?: number
          max_retries?: number
          is_favorite?: boolean
          is_public?: boolean
          download_count?: number
          view_count?: number
          tags?: string[]
          category?: string | null
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          prompt?: string
          enhanced_prompt?: string | null
          settings?: Record<string, any>
          status?: VideoStatus
          stage?: string
          progress?: number
          estimated_time_remaining?: number | null
          video_url?: string | null
          thumbnail_url?: string | null
          preview_url?: string | null
          duration?: number | null
          resolution?: string
          file_size?: number | null
          format?: string
          metadata?: Record<string, any> | null
          veo_job_id?: string | null
          cost_credits?: number
          generation_time?: number | null
          error?: Record<string, any> | null
          retry_count?: number
          max_retries?: number
          is_favorite?: boolean
          is_public?: boolean
          download_count?: number
          view_count?: number
          tags?: string[]
          category?: string | null
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }

      // Video generations table
      video_generations: {
        Row: {
          id: string
          video_id: string
          user_id: string
          priority: number
          queue_position: number | null
          assigned_worker: string | null
          started_at: string | null
          estimated_completion: string | null
          retry_after: string | null
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          video_id: string
          user_id: string
          priority?: number
          queue_position?: number | null
          assigned_worker?: string | null
          started_at?: string | null
          estimated_completion?: string | null
          retry_after?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string
          priority?: number
          queue_position?: number | null
          assigned_worker?: string | null
          started_at?: string | null
          estimated_completion?: string | null
          retry_after?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }

      // Thumbnails table
      thumbnails: {
        Row: {
          id: string
          video_id: string
          url: string
          timestamp_seconds: number
          width: number
          height: number
          format: string
          file_size: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          url: string
          timestamp_seconds?: number
          width: number
          height: number
          format?: string
          file_size: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          url?: string
          timestamp_seconds?: number
          width?: number
          height?: number
          format?: string
          file_size?: number
          is_default?: boolean
          created_at?: string
        }
      }

      // API keys table
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          permissions: string[]
          last_used_at: string | null
          usage_count: number
          rate_limit_rpm: number
          is_active: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          permissions?: string[]
          last_used_at?: string | null
          usage_count?: number
          rate_limit_rpm?: number
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          key_prefix?: string
          permissions?: string[]
          last_used_at?: string | null
          usage_count?: number
          rate_limit_rpm?: number
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
        }
      }

      // Usage events table
      usage_events: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          type: UsageEventType
          count: number
          video_id: string | null
          metadata: Record<string, any> | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          type: UsageEventType
          count?: number
          video_id?: string | null
          metadata?: Record<string, any> | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          type?: UsageEventType
          count?: number
          video_id?: string | null
          metadata?: Record<string, any> | null
          timestamp?: string
        }
      }

      // Invoices table
      invoices: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          paddle_invoice_id: string | null
          number: string
          status: InvoiceStatus
          amount: number
          tax_amount: number
          total: number
          currency: string
          description: string
          line_items: Record<string, any>[]
          issued_at: string
          due_at: string
          paid_at: string | null
          download_url: string | null
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          paddle_invoice_id?: string | null
          number: string
          status?: InvoiceStatus
          amount: number
          tax_amount?: number
          total: number
          currency?: string
          description: string
          line_items?: Record<string, any>[]
          issued_at?: string
          due_at: string
          paid_at?: string | null
          download_url?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          paddle_invoice_id?: string | null
          number?: string
          status?: InvoiceStatus
          amount?: number
          tax_amount?: number
          total?: number
          currency?: string
          description?: string
          line_items?: Record<string, any>[]
          issued_at?: string
          due_at?: string
          paid_at?: string | null
          download_url?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }

      // Webhook events table
      webhook_events: {
        Row: {
          id: string
          paddle_alert_id: string
          event_type: string
          processed: boolean
          processed_at: string | null
          retry_count: number
          data: Record<string, any>
          error: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          paddle_alert_id: string
          event_type: string
          processed?: boolean
          processed_at?: string | null
          retry_count?: number
          data: Record<string, any>
          error?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          paddle_alert_id?: string
          event_type?: string
          processed?: boolean
          processed_at?: string | null
          retry_count?: number
          data?: Record<string, any>
          error?: Record<string, any> | null
          created_at?: string
        }
      }

      // App config table
      app_config: {
        Row: {
          key: string
          value: Record<string, any>
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          value: Record<string, any>
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Record<string, any>
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // Audit logs table
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_values: Record<string, any> | null
          new_values: Record<string, any> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_values?: Record<string, any> | null
          new_values?: Record<string, any> | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_values?: Record<string, any> | null
          new_values?: Record<string, any> | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }

      // Email logs table (for onboarding function)
      email_logs: {
        Row: {
          id: string
          user_id: string
          email_type: string
          template_id: string
          recipient_email: string
          status: string
          message_id: string | null
          error: string | null
          sent_at: string | null
          opened_at: string | null
          clicked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_type: string
          template_id: string
          recipient_email: string
          status: string
          message_id?: string | null
          error?: string | null
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_type?: string
          template_id?: string
          recipient_email?: string
          status?: string
          message_id?: string | null
          error?: string | null
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          created_at?: string
        }
      }

      // Scheduled emails table
      scheduled_emails: {
        Row: {
          id: string
          user_id: string
          email_type: string
          template_id: string
          recipient_email: string
          recipient_name: string
          tier: string
          scheduled_for: string
          condition_check: string | null
          status: string
          processed_at: string | null
          message_id: string | null
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_type: string
          template_id: string
          recipient_email: string
          recipient_name: string
          tier: string
          scheduled_for: string
          condition_check?: string | null
          status?: string
          processed_at?: string | null
          message_id?: string | null
          error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_type?: string
          template_id?: string
          recipient_email?: string
          recipient_name?: string
          tier?: string
          scheduled_for?: string
          condition_check?: string | null
          status?: string
          processed_at?: string | null
          message_id?: string | null
          error?: string | null
          created_at?: string
        }
      }

      // Rate limit log table
      rate_limit_log: {
        Row: {
          id: string
          user_id: string
          request_type: string
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          request_type: string
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          request_type?: string
          ip_address?: string | null
          created_at?: string
        }
      }
    }

    Views: {
      // User analytics view
      user_analytics: {
        Row: {
          user_id: string
          tier: PricingTier
          total_videos: number
          completed_videos: number
          failed_videos: number
          total_storage_mb: number
          last_video_created: string | null
          account_age_days: number
          is_active: boolean
        }
      }

      // System analytics view
      system_analytics: {
        Row: {
          metric_name: string
          metric_value: number
          metric_date: string
          tier: PricingTier | null
        }
      }

      // Video generation queue view
      generation_queue: {
        Row: {
          video_id: string
          user_id: string
          user_tier: PricingTier
          priority: number
          queue_position: number | null
          estimated_wait_minutes: number | null
          created_at: string
        }
      }
    }

    Functions: {
      // User management functions
      create_video_generation: {
        Args: {
          p_user_id: string
          p_title: string
          p_prompt: string
          p_settings?: Record<string, any>
        }
        Returns: string
      }

      check_generation_capacity: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
      }

      handle_subscription_change: {
        Args: {
          p_user_id: string
          p_paddle_subscription_id: string
          p_status: SubscriptionStatus
          p_plan: PricingTier
          p_period_start: string
          p_period_end: string
          p_metadata?: Record<string, any>
        }
        Returns: string
      }

      cancel_subscription: {
        Args: {
          p_subscription_id: string
          p_immediately?: boolean
        }
        Returns: void
      }

      update_video_status: {
        Args: {
          p_video_id: string
          p_status: VideoStatus
          p_stage?: string
          p_progress?: number
          p_estimated_time?: number
          p_error?: Record<string, any>
        }
        Returns: void
      }

      record_usage_event: {
        Args: {
          p_user_id: string
          p_type: UsageEventType
          p_count?: number
          p_video_id?: string
          p_metadata?: Record<string, any>
        }
        Returns: void
      }

      update_usage_stats: {
        Args: {
          p_user_id: string
        }
        Returns: void
      }

      generate_user_api_key: {
        Args: {
          p_user_id: string
          p_name: string
          p_permissions?: string[]
        }
        Returns: string
      }

      revoke_api_key: {
        Args: {
          p_key_id: string
          p_user_id: string
        }
        Returns: void
      }

      get_user_analytics: {
        Args: {
          p_user_id: string
          p_period_days?: number
        }
        Returns: {
          total_videos: number
          completed_videos: number
          failed_videos: number
          total_views: number
          total_downloads: number
          avg_generation_time: number
          favorite_count: number
        }[]
      }

      get_system_analytics: {
        Args: {
          p_period_days?: number
        }
        Returns: {
          total_users: number
          active_users: number
          premium_users: number
          total_videos: number
          videos_today: number
          avg_queue_time: number
          success_rate: number
        }[]
      }

      cleanup_expired_videos: {
        Args: {
          retention_days?: number
        }
        Returns: number
      }

      run_maintenance_tasks: {
        Args: {}
        Returns: string
      }

      assign_generation_to_worker: {
        Args: {
          worker_name: string
          max_assignments?: number
        }
        Returns: string[]
      }

      initialize_user_usage: {
        Args: {
          user_id: string
          plan?: PricingTier
        }
        Returns: void
      }
    }

    Enums: {
      video_status: VideoStatus
      subscription_status: SubscriptionStatus  
      payment_status: PaymentStatus
      payment_type: PaymentType
      invoice_status: InvoiceStatus
      pricing_tier: PricingTier
      usage_event_type: UsageEventType
    }
  }
}

// =============================================================================
// TYPE ALIASES FOR CONVENIENCE
// =============================================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Table type aliases
export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type Subscription = Tables<'subscriptions'>
export type SubscriptionInsert = TablesInsert<'subscriptions'>
export type SubscriptionUpdate = TablesUpdate<'subscriptions'>

export type Payment = Tables<'payments'>
export type PaymentInsert = TablesInsert<'payments'>
export type PaymentUpdate = TablesUpdate<'payments'>

export type Usage = Tables<'usage'>
export type UsageInsert = TablesInsert<'usage'>
export type UsageUpdate = TablesUpdate<'usage'>

export type Video = Tables<'videos'>
export type VideoInsert = TablesInsert<'videos'>
export type VideoUpdate = TablesUpdate<'videos'>

export type VideoGeneration = Tables<'video_generations'>
export type VideoGenerationInsert = TablesInsert<'video_generations'>
export type VideoGenerationUpdate = TablesUpdate<'video_generations'>

export type Thumbnail = Tables<'thumbnails'>
export type ThumbnailInsert = TablesInsert<'thumbnails'>
export type ThumbnailUpdate = TablesUpdate<'thumbnails'>

export type ApiKey = Tables<'api_keys'>
export type ApiKeyInsert = TablesInsert<'api_keys'>
export type ApiKeyUpdate = TablesUpdate<'api_keys'>

export type UsageEvent = Tables<'usage_events'>
export type UsageEventInsert = TablesInsert<'usage_events'>
export type UsageEventUpdate = TablesUpdate<'usage_events'>

export type Invoice = Tables<'invoices'>
export type InvoiceInsert = TablesInsert<'invoices'>
export type InvoiceUpdate = TablesUpdate<'invoices'>

export type WebhookEvent = Tables<'webhook_events'>
export type WebhookEventInsert = TablesInsert<'webhook_events'>
export type WebhookEventUpdate = TablesUpdate<'webhook_events'>

export type AppConfig = Tables<'app_config'>
export type AppConfigInsert = TablesInsert<'app_config'>
export type AppConfigUpdate = TablesUpdate<'app_config'>

export type AuditLog = Tables<'audit_logs'>
export type AuditLogInsert = TablesInsert<'audit_logs'>
export type AuditLogUpdate = TablesUpdate<'audit_logs'>

export type EmailLog = Tables<'email_logs'>
export type EmailLogInsert = TablesInsert<'email_logs'>
export type EmailLogUpdate = TablesUpdate<'email_logs'>

export type ScheduledEmail = Tables<'scheduled_emails'>
export type ScheduledEmailInsert = TablesInsert<'scheduled_emails'>
export type ScheduledEmailUpdate = TablesUpdate<'scheduled_emails'>

export type RateLimitLog = Tables<'rate_limit_log'>
export type RateLimitLogInsert = TablesInsert<'rate_limit_log'>
export type RateLimitLogUpdate = TablesUpdate<'rate_limit_log'>

// View type aliases
export type UserAnalytics = Database['public']['Views']['user_analytics']['Row']
export type SystemAnalytics = Database['public']['Views']['system_analytics']['Row']
export type GenerationQueue = Database['public']['Views']['generation_queue']['Row']

// Function type aliases
export type DatabaseFunctions = Database['public']['Functions']

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Generic database response type
export interface DatabaseResponse<T> {
  data: T | null
  error: Error | null
}

// Pagination parameters
export interface PaginationParams {
  page: number
  pageSize: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

// Filter parameters for common queries
export interface VideoFilters {
  status?: VideoStatus[]
  tier?: PricingTier[]
  dateFrom?: string
  dateTo?: string
  category?: string
  tags?: string[]
  isPublic?: boolean
  isFavorite?: boolean
}

export interface UserFilters {
  tier?: PricingTier[]
  isActive?: boolean
  dateFrom?: string
  dateTo?: string
}

// Analytics aggregation types
export interface VideoAnalytics {
  totalVideos: number
  completedVideos: number
  failedVideos: number
  averageGenerationTime: number
  totalViews: number
  totalDownloads: number
  popularCategories: Array<{ category: string; count: number }>
  popularTags: Array<{ tag: string; count: number }>
}

export interface UsageAnalytics {
  totalUsers: number
  activeUsers: number
  usersByTier: Record<PricingTier, number>
  videosPerDay: Array<{ date: string; count: number }>
  averageVideosPerUser: number
  retentionRate: number
}

// Real-time subscription types
export interface RealtimeSubscription<T> {
  subscribe: () => void
  unsubscribe: () => void
  data: T | null
  loading: boolean
  error: Error | null
}

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

export default Database