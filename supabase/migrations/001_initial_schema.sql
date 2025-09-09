-- =====================================================================================
-- Kateriss AI Video Generator - Initial Database Schema
-- Created: 2025-09-09
-- Description: Core database schema with comprehensive tables for video generation,
--              user management, subscriptions, payments, and usage tracking
-- =====================================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================================================
-- CUSTOM TYPES AND ENUMS
-- =====================================================================================

-- Video generation status enum
CREATE TYPE video_status AS ENUM (
    'pending',
    'processing', 
    'completed',
    'failed',
    'cancelled'
);

-- Subscription status enum  
CREATE TYPE subscription_status AS ENUM (
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'trialing',
    'incomplete',
    'incomplete_expired',
    'paused'
);

-- Payment status enum
CREATE TYPE payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'canceled',
    'refunded',
    'partially_refunded'
);

-- Payment type enum
CREATE TYPE payment_type AS ENUM (
    'subscription',
    'one-time',
    'upgrade',
    'downgrade',
    'refund'
);

-- Invoice status enum
CREATE TYPE invoice_status AS ENUM (
    'draft',
    'open', 
    'paid',
    'void',
    'uncollectible'
);

-- Pricing tier enum
CREATE TYPE pricing_tier AS ENUM (
    'pay-per-video',
    'basic',
    'premium'
);

-- Usage event type enum
CREATE TYPE usage_event_type AS ENUM (
    'video_generated',
    'subscription_reset',
    'upgrade',
    'downgrade'
);

-- =====================================================================================
-- CORE TABLES
-- =====================================================================================

-- Users profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    subscription_tier pricing_tier DEFAULT 'pay-per-video' NOT NULL,
    subscription_id UUID,
    api_key_hash TEXT, -- Encrypted API key for Premium users
    api_key_created_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Subscriptions table for Paddle integration
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    paddle_subscription_id TEXT UNIQUE NOT NULL,
    paddle_plan_id TEXT NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    plan pricing_tier NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payments table for transaction tracking
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    paddle_order_id TEXT UNIQUE NOT NULL,
    paddle_checkout_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status payment_status NOT NULL DEFAULT 'pending',
    type payment_type NOT NULL DEFAULT 'one-time',
    description TEXT NOT NULL,
    video_count INTEGER, -- For pay-per-video payments
    receipt_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    plan pricing_tier NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    videos_generated INTEGER DEFAULT 0 NOT NULL,
    videos_limit INTEGER, -- NULL for unlimited
    credits_used INTEGER DEFAULT 0 NOT NULL,
    credits_total INTEGER DEFAULT 0 NOT NULL,
    overage_videos INTEGER DEFAULT 0 NOT NULL,
    overage_charges DECIMAL(10,2) DEFAULT 0 NOT NULL,
    reset_date TIMESTAMPTZ NOT NULL,
    last_reset TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_videos_non_negative CHECK (videos_generated >= 0),
    CONSTRAINT check_credits_non_negative CHECK (credits_used >= 0)
);

-- Videos table for generated content
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    enhanced_prompt TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    status video_status NOT NULL DEFAULT 'pending',
    stage TEXT DEFAULT 'queued',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    estimated_time_remaining INTEGER, -- seconds
    video_url TEXT,
    thumbnail_url TEXT,
    preview_url TEXT,
    duration DECIMAL(6,2), -- seconds
    resolution TEXT DEFAULT '1080p',
    file_size BIGINT, -- bytes
    format TEXT DEFAULT 'mp4',
    metadata JSONB DEFAULT '{}',
    veo_job_id TEXT,
    cost_credits INTEGER NOT NULL DEFAULT 1,
    generation_time INTEGER, -- seconds
    error JSONB,
    retry_count INTEGER DEFAULT 0 NOT NULL,
    max_retries INTEGER DEFAULT 3 NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0 NOT NULL,
    view_count INTEGER DEFAULT 0 NOT NULL,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Video generation queue for processing management
CREATE TABLE IF NOT EXISTS video_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 5 NOT NULL, -- 1=highest, 10=lowest
    queue_position INTEGER,
    assigned_worker TEXT,
    started_at TIMESTAMPTZ,
    estimated_completion TIMESTAMPTZ,
    retry_after TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Thumbnails table for video previews
CREATE TABLE IF NOT EXISTS thumbnails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    timestamp_seconds DECIMAL(6,2) NOT NULL DEFAULT 0, -- Timestamp in video
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    format TEXT NOT NULL DEFAULT 'jpg',
    file_size BIGINT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- API keys table for Premium users
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the actual key
    key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "kv_abc123...")
    permissions TEXT[] DEFAULT '{"video:create", "video:read"}',
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    rate_limit_rpm INTEGER DEFAULT 60 NOT NULL, -- Requests per minute
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Usage events table for detailed tracking
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    type usage_event_type NOT NULL,
    count INTEGER DEFAULT 1 NOT NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Invoices table for billing
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    paddle_invoice_id TEXT UNIQUE,
    number TEXT NOT NULL,
    status invoice_status NOT NULL DEFAULT 'draft',
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    line_items JSONB NOT NULL DEFAULT '[]',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    download_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Webhook events table for Paddle webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paddle_alert_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0 NOT NULL,
    data JSONB NOT NULL,
    error JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================================

-- Profile indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_api_key_hash ON profiles(api_key_hash);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Subscription indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_paddle_id ON subscriptions(paddle_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period ON subscriptions(current_period_start, current_period_end);

-- Payment indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_paddle_order_id ON payments(paddle_order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Usage indexes
CREATE INDEX idx_usage_user_id ON usage(user_id);
CREATE INDEX idx_usage_subscription_id ON usage(subscription_id);
CREATE INDEX idx_usage_period ON usage(period_start, period_end);
CREATE INDEX idx_usage_reset_date ON usage(reset_date);

-- Video indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_completed_at ON videos(completed_at DESC);
CREATE INDEX idx_videos_is_public ON videos(is_public) WHERE is_public = true;
CREATE INDEX idx_videos_is_favorite ON videos(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_videos_tags ON videos USING GIN(tags);
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_videos_veo_job_id ON videos(veo_job_id);

-- Video generation queue indexes
CREATE INDEX idx_video_generations_video_id ON video_generations(video_id);
CREATE INDEX idx_video_generations_user_id ON video_generations(user_id);
CREATE INDEX idx_video_generations_priority ON video_generations(priority, created_at);
CREATE INDEX idx_video_generations_queue_position ON video_generations(queue_position);

-- Thumbnail indexes
CREATE INDEX idx_thumbnails_video_id ON thumbnails(video_id);
CREATE INDEX idx_thumbnails_is_default ON thumbnails(video_id, is_default) WHERE is_default = true;

-- API key indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active) WHERE is_active = true;

-- Usage event indexes
CREATE INDEX idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX idx_usage_events_type ON usage_events(type);
CREATE INDEX idx_usage_events_timestamp ON usage_events(timestamp DESC);
CREATE INDEX idx_usage_events_video_id ON usage_events(video_id);

-- Invoice indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_at ON invoices(due_at);
CREATE INDEX idx_invoices_issued_at ON invoices(issued_at DESC);

-- Webhook event indexes
CREATE INDEX idx_webhook_events_paddle_alert_id ON webhook_events(paddle_alert_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed) WHERE processed = false;
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- =====================================================================================
-- CONSTRAINTS AND UNIQUE KEYS
-- =====================================================================================

-- Ensure only one default thumbnail per video
CREATE UNIQUE INDEX idx_thumbnails_default_unique 
ON thumbnails(video_id) WHERE is_default = true;

-- Ensure only one active subscription per user
CREATE UNIQUE INDEX idx_subscriptions_active_user 
ON subscriptions(user_id) 
WHERE status IN ('active', 'trialing', 'past_due');

-- Ensure unique usage record per user per period
CREATE UNIQUE INDEX idx_usage_user_period 
ON usage(user_id, period_start, period_end);

-- Ensure unique queue position (when assigned)
CREATE UNIQUE INDEX idx_video_generations_queue_position_unique
ON video_generations(queue_position) WHERE queue_position IS NOT NULL;

-- =====================================================================================
-- UTILITY FUNCTIONS
-- =====================================================================================

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := 'kv_';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..32 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to hash API key
CREATE OR REPLACE FUNCTION hash_api_key(key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to get API key prefix
CREATE OR REPLACE FUNCTION get_api_key_prefix(key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN substr(key, 1, 8) || '...';
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================================================

-- Trigger for profiles updated_at
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for subscriptions updated_at  
CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for usage updated_at
CREATE TRIGGER trigger_usage_updated_at
    BEFORE UPDATE ON usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for videos updated_at
CREATE TRIGGER trigger_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for video_generations updated_at
CREATE TRIGGER trigger_video_generations_updated_at
    BEFORE UPDATE ON video_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================================================

-- Insert default pricing plans configuration
INSERT INTO public.profiles (id, email, full_name, subscription_tier, is_active, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'system@kateriss.ai', 'System User', 'premium', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create configuration table for app settings
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default configuration
INSERT INTO app_config (key, value, description) VALUES 
('pricing_plans', '[
    {
        "id": "pay-per-video",
        "name": "Pay-per-Video",
        "tier": "pay-per-video",
        "price": 2.49,
        "credits": 1,
        "paddle_plan_id": null
    },
    {
        "id": "basic-monthly", 
        "name": "Basic Plan",
        "tier": "basic",
        "price": 29.00,
        "credits": 20,
        "paddle_plan_id": "basic_monthly_plan"
    },
    {
        "id": "premium-monthly",
        "name": "Premium Plan", 
        "tier": "premium",
        "price": 149.00,
        "credits": null,
        "paddle_plan_id": "premium_monthly_plan"
    }
]', 'Available pricing plans configuration'),
('rate_limits', '{
    "pay-per-video": {"rpm": 10, "concurrent": 1},
    "basic": {"rpm": 30, "concurrent": 2},
    "premium": {"rpm": 100, "concurrent": 5}
}', 'Rate limiting configuration by tier'),
('video_settings', '{
    "max_duration": {"basic": 30, "premium": 120},
    "max_resolution": {"basic": "1080p", "premium": "4k"},
    "formats": ["mp4", "mov", "webm"],
    "quality_presets": ["draft", "standard", "high", "ultra"]
}', 'Video generation settings and limits');

-- Trigger for app_config updated_at
CREATE TRIGGER trigger_app_config_updated_at
    BEFORE UPDATE ON app_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();