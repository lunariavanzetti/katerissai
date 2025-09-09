-- =====================================================================================
-- Kateriss AI Video Generator - Row Level Security Policies
-- Created: 2025-09-09
-- Description: Comprehensive RLS policies for secure data access control
--              with user-specific, admin, and subscription-based permissions
-- =====================================================================================

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- UTILITY FUNCTIONS FOR RLS
-- =====================================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    ),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's subscription tier
CREATE OR REPLACE FUNCTION auth.get_user_tier()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT subscription_tier::text
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has premium subscription
CREATE OR REPLACE FUNCTION auth.is_premium()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT subscription_tier = 'premium'
      FROM profiles
      WHERE id = auth.uid()
    ),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns resource
CREATE OR REPLACE FUNCTION auth.owns_resource(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- PROFILES TABLE POLICIES
-- =====================================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile  
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can create own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (auth.is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE USING (auth.is_admin());

-- Public profiles are viewable by authenticated users (for sharing)
CREATE POLICY "Public profile info viewable" ON profiles
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND id IN (
            SELECT user_id FROM videos 
            WHERE is_public = true
        )
    );

-- =====================================================================================
-- SUBSCRIPTIONS TABLE POLICIES  
-- =====================================================================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.owns_resource(user_id));

-- Users can create their own subscriptions (via webhook/payment)
CREATE POLICY "Users can create own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.owns_resource(user_id));

-- System can update subscriptions (for webhooks)
CREATE POLICY "System can update subscriptions" ON subscriptions
    FOR UPDATE USING (
        auth.is_admin() 
        OR auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions" ON subscriptions
    FOR ALL USING (auth.is_admin());

-- =====================================================================================
-- PAYMENTS TABLE POLICIES
-- =====================================================================================

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.owns_resource(user_id));

-- System can create payments (webhook integration)
CREATE POLICY "System can create payments" ON payments
    FOR INSERT WITH CHECK (
        auth.is_admin()
        OR auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- System can update payments (webhook status updates)
CREATE POLICY "System can update payments" ON payments
    FOR UPDATE USING (
        auth.is_admin()
        OR auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- Admins can manage all payments
CREATE POLICY "Admins can manage payments" ON payments
    FOR ALL USING (auth.is_admin());

-- =====================================================================================
-- USAGE TABLE POLICIES
-- =====================================================================================

-- Users can view their own usage data
CREATE POLICY "Users can view own usage" ON usage
    FOR SELECT USING (auth.owns_resource(user_id));

-- System can manage usage data
CREATE POLICY "System can manage usage" ON usage
    FOR ALL USING (
        auth.is_admin()
        OR auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- Users can create their own usage records (initialization)
CREATE POLICY "Users can create own usage" ON usage
    FOR INSERT WITH CHECK (auth.owns_resource(user_id));

-- =====================================================================================
-- VIDEOS TABLE POLICIES
-- =====================================================================================

-- Users can view their own videos
CREATE POLICY "Users can view own videos" ON videos
    FOR SELECT USING (auth.owns_resource(user_id));

-- Users can create their own videos
CREATE POLICY "Users can create own videos" ON videos
    FOR INSERT WITH CHECK (auth.owns_resource(user_id));

-- Users can update their own videos (metadata, favorites, etc.)
CREATE POLICY "Users can update own videos" ON videos
    FOR UPDATE USING (auth.owns_resource(user_id))
    WITH CHECK (auth.owns_resource(user_id));

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos" ON videos
    FOR DELETE USING (auth.owns_resource(user_id));

-- Public videos are viewable by all authenticated users
CREATE POLICY "Public videos viewable" ON videos
    FOR SELECT USING (
        is_public = true 
        AND auth.role() = 'authenticated'
    );

-- System can update video status and processing info
CREATE POLICY "System can update video processing" ON videos
    FOR UPDATE USING (
        auth.is_admin()
        OR auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- Admins can manage all videos
CREATE POLICY "Admins can manage all videos" ON videos
    FOR ALL USING (auth.is_admin());

-- =====================================================================================
-- VIDEO GENERATIONS TABLE POLICIES
-- =====================================================================================

-- Users can view their own video generations
CREATE POLICY "Users can view own generations" ON video_generations
    FOR SELECT USING (auth.owns_resource(user_id));

-- Users can create their own video generations
CREATE POLICY "Users can create own generations" ON video_generations
    FOR INSERT WITH CHECK (auth.owns_resource(user_id));

-- System can update generation status
CREATE POLICY "System can update generations" ON video_generations
    FOR UPDATE USING (
        auth.is_admin()
        OR auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- Admins can manage all generations
CREATE POLICY "Admins can manage generations" ON video_generations
    FOR ALL USING (auth.is_admin());

-- =====================================================================================
-- THUMBNAILS TABLE POLICIES
-- =====================================================================================

-- Users can view thumbnails for their own videos
CREATE POLICY "Users can view own video thumbnails" ON thumbnails
    FOR SELECT USING (
        video_id IN (
            SELECT id FROM videos WHERE user_id = auth.uid()
        )
    );

-- Users can view thumbnails for public videos
CREATE POLICY "Public video thumbnails viewable" ON thumbnails
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND video_id IN (
            SELECT id FROM videos WHERE is_public = true
        )
    );

-- System can manage thumbnails
CREATE POLICY "System can manage thumbnails" ON thumbnails
    FOR ALL USING (
        auth.is_admin()
        OR auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- =====================================================================================
-- API KEYS TABLE POLICIES
-- =====================================================================================

-- Only premium users can view their API keys
CREATE POLICY "Premium users can view own API keys" ON api_keys
    FOR SELECT USING (
        auth.owns_resource(user_id) 
        AND auth.is_premium()
    );

-- Only premium users can create API keys
CREATE POLICY "Premium users can create API keys" ON api_keys
    FOR INSERT WITH CHECK (
        auth.owns_resource(user_id) 
        AND auth.is_premium()
    );

-- Premium users can update their own API keys
CREATE POLICY "Premium users can update own API keys" ON api_keys
    FOR UPDATE USING (
        auth.owns_resource(user_id) 
        AND auth.is_premium()
    ) WITH CHECK (
        auth.owns_resource(user_id) 
        AND auth.is_premium()
    );

-- Premium users can delete their own API keys
CREATE POLICY "Premium users can delete own API keys" ON api_keys
    FOR DELETE USING (
        auth.owns_resource(user_id) 
        AND auth.is_premium()
    );

-- System can validate API keys (for API authentication)
CREATE POLICY "System can validate API keys" ON api_keys
    FOR SELECT USING (
        auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- Admins can manage all API keys
CREATE POLICY "Admins can manage API keys" ON api_keys
    FOR ALL USING (auth.is_admin());

-- =====================================================================================
-- USAGE EVENTS TABLE POLICIES
-- =====================================================================================

-- Users can view their own usage events
CREATE POLICY "Users can view own usage events" ON usage_events
    FOR SELECT USING (auth.owns_resource(user_id));

-- System can create usage events
CREATE POLICY "System can create usage events" ON usage_events
    FOR INSERT WITH CHECK (
        auth.is_admin()
        OR auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- Admins can manage all usage events
CREATE POLICY "Admins can manage usage events" ON usage_events
    FOR ALL USING (auth.is_admin());

-- =====================================================================================
-- INVOICES TABLE POLICIES
-- =====================================================================================

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (auth.owns_resource(user_id));

-- System can manage invoices
CREATE POLICY "System can manage invoices" ON invoices
    FOR ALL USING (
        auth.is_admin()
        OR auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- =====================================================================================
-- WEBHOOK EVENTS TABLE POLICIES
-- =====================================================================================

-- Only system and admins can access webhook events
CREATE POLICY "System can manage webhook events" ON webhook_events
    FOR ALL USING (
        auth.is_admin()
        OR auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- =====================================================================================
-- APP CONFIG TABLE POLICIES
-- =====================================================================================

-- Authenticated users can read app configuration
CREATE POLICY "Users can read app config" ON app_config
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify app configuration
CREATE POLICY "Admins can manage app config" ON app_config
    FOR ALL USING (auth.is_admin());

-- =====================================================================================
-- SPECIAL POLICIES FOR API ACCESS
-- =====================================================================================

-- Create a special role for API key authentication
-- This would be used when authenticating via API keys instead of JWT

-- Function to validate API key access
CREATE OR REPLACE FUNCTION auth.validate_api_key_access(
    resource_user_id UUID,
    required_permission TEXT DEFAULT 'video:read'
)
RETURNS BOOLEAN AS $$
DECLARE
    api_key_header TEXT;
    key_hash TEXT;
    key_user_id UUID;
    key_permissions TEXT[];
    is_valid BOOLEAN := false;
BEGIN
    -- Get API key from headers (this would be set by your API middleware)
    api_key_header := current_setting('request.headers', true)::json ->> 'x-api-key';
    
    IF api_key_header IS NULL THEN
        RETURN false;
    END IF;
    
    -- Hash the provided key
    key_hash := encode(digest(api_key_header, 'sha256'), 'hex');
    
    -- Validate key and get permissions
    SELECT user_id, permissions INTO key_user_id, key_permissions
    FROM api_keys
    WHERE key_hash = key_hash
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Check if key exists and user matches
    IF key_user_id IS NOT NULL AND key_user_id = resource_user_id THEN
        -- Check if required permission exists
        IF required_permission = ANY(key_permissions) THEN
            is_valid := true;
            
            -- Update last used timestamp
            UPDATE api_keys 
            SET last_used_at = NOW(), usage_count = usage_count + 1
            WHERE key_hash = key_hash;
        END IF;
    END IF;
    
    RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- POLICIES FOR REAL-TIME SUBSCRIPTIONS
-- =====================================================================================

-- Allow users to subscribe to their own video status updates
ALTER publication supabase_realtime ADD TABLE videos;
ALTER publication supabase_realtime ADD TABLE video_generations;
ALTER publication supabase_realtime ADD TABLE usage;

-- Grant necessary permissions for realtime
GRANT SELECT ON videos TO anon, authenticated;
GRANT SELECT ON video_generations TO anon, authenticated;
GRANT SELECT ON usage TO anon, authenticated;

-- =====================================================================================
-- SECURITY DEFINER FUNCTIONS FOR CONTROLLED ACCESS
-- =====================================================================================

-- Function to safely increment video view count
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE videos 
    SET view_count = view_count + 1,
        updated_at = NOW()
    WHERE id = video_id 
        AND (is_public = true OR user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely increment download count
CREATE OR REPLACE FUNCTION increment_video_downloads(video_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE videos 
    SET download_count = download_count + 1,
        updated_at = NOW()
    WHERE id = video_id 
        AND (is_public = true OR user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely toggle favorite status
CREATE OR REPLACE FUNCTION toggle_video_favorite(video_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    new_favorite_status BOOLEAN;
BEGIN
    UPDATE videos 
    SET is_favorite = NOT is_favorite,
        updated_at = NOW()
    WHERE id = video_id 
        AND user_id = auth.uid()
    RETURNING is_favorite INTO new_favorite_status;
    
    RETURN new_favorite_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- AUDIT LOGGING POLICIES
-- =====================================================================================

-- Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (auth.is_admin());

-- System can create audit logs
CREATE POLICY "System can create audit logs" ON audit_logs
    FOR INSERT WITH CHECK (
        auth.is_admin()
        OR auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
    );

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================================================
-- COMMENTED POLICIES FOR REFERENCE
-- =====================================================================================

/*
-- Example of time-based access (could be used for trial periods)
CREATE POLICY "Trial users time-limited access" ON videos
    FOR SELECT USING (
        auth.owns_resource(user_id)
        AND (
            auth.get_user_tier() != 'trial'
            OR created_at > (NOW() - INTERVAL '30 days')
        )
    );

-- Example of rate limiting policy (would need additional tracking)
CREATE POLICY "Rate limited video creation" ON videos
    FOR INSERT WITH CHECK (
        auth.owns_resource(user_id)
        AND NOT EXISTS (
            SELECT 1 FROM videos 
            WHERE user_id = auth.uid() 
                AND created_at > (NOW() - INTERVAL '1 hour')
                AND auth.get_user_tier() = 'basic'
            HAVING COUNT(*) >= 5
        )
    );
*/