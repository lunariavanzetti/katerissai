-- =====================================================================================
-- Kateriss AI Video Generator - Database Functions and Triggers
-- Created: 2025-09-09
-- Description: Advanced database functions for automation, usage tracking,
--              video generation management, and business logic
-- =====================================================================================

-- =====================================================================================
-- USER MANAGEMENT FUNCTIONS
-- =====================================================================================

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    default_plan pricing_tier := 'pay-per-video';
BEGIN
    -- Insert profile for new user
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        subscription_tier,
        onboarding_completed,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        default_plan,
        false,
        NOW(),
        NOW()
    );
    
    -- Initialize usage tracking
    PERFORM initialize_user_usage(NEW.id, default_plan);
    
    -- Create audit log
    INSERT INTO audit_logs (user_id, action, table_name, new_values)
    VALUES (NEW.id, 'user_created', 'profiles', to_jsonb(NEW));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile creation on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function to initialize usage tracking for new user
CREATE OR REPLACE FUNCTION initialize_user_usage(
    user_id UUID,
    plan pricing_tier DEFAULT 'pay-per-video'
)
RETURNS VOID AS $$
DECLARE
    start_date TIMESTAMPTZ := date_trunc('month', NOW());
    end_date TIMESTAMPTZ := (date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second');
    video_limit INTEGER;
BEGIN
    -- Set video limits based on plan
    CASE plan
        WHEN 'pay-per-video' THEN video_limit := 0; -- Must purchase each video
        WHEN 'basic' THEN video_limit := 20;
        WHEN 'premium' THEN video_limit := NULL; -- Unlimited
    END CASE;
    
    -- Insert usage record
    INSERT INTO usage (
        user_id,
        plan,
        period_start,
        period_end,
        videos_generated,
        videos_limit,
        credits_used,
        credits_total,
        reset_date
    ) VALUES (
        user_id,
        plan,
        start_date,
        end_date,
        0,
        video_limit,
        0,
        CASE plan
            WHEN 'basic' THEN 20
            WHEN 'premium' THEN 99999
            ELSE 0
        END,
        end_date
    ) ON CONFLICT (user_id, period_start, period_end) 
    DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user's last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET last_login = NOW(),
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- VIDEO GENERATION FUNCTIONS
-- =====================================================================================

-- Function to create video generation request
CREATE OR REPLACE FUNCTION create_video_generation(
    p_user_id UUID,
    p_title TEXT,
    p_prompt TEXT,
    p_settings JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    video_id UUID;
    generation_id UUID;
    user_tier pricing_tier;
    can_generate BOOLEAN;
    priority_level INTEGER;
BEGIN
    -- Check if user can generate video
    SELECT subscription_tier INTO user_tier
    FROM profiles WHERE id = p_user_id;
    
    -- Validate generation capacity
    SELECT check_generation_capacity(p_user_id) INTO can_generate;
    
    IF NOT can_generate THEN
        RAISE EXCEPTION 'Generation capacity exceeded for current plan';
    END IF;
    
    -- Set priority based on tier
    CASE user_tier
        WHEN 'premium' THEN priority_level := 1;
        WHEN 'basic' THEN priority_level := 3;
        ELSE priority_level := 5;
    END CASE;
    
    -- Create video record
    INSERT INTO videos (
        user_id,
        title,
        prompt,
        settings,
        cost_credits,
        created_at
    ) VALUES (
        p_user_id,
        p_title,
        p_prompt,
        p_settings,
        1, -- Default cost
        NOW()
    ) RETURNING id INTO video_id;
    
    -- Create generation queue entry
    INSERT INTO video_generations (
        video_id,
        user_id,
        priority,
        created_at
    ) VALUES (
        video_id,
        p_user_id,
        priority_level,
        NOW()
    ) RETURNING id INTO generation_id;
    
    -- Update queue positions
    PERFORM update_generation_queue_positions();
    
    -- Record usage event
    PERFORM record_usage_event(p_user_id, 'video_generated');
    
    RETURN video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can generate video
CREATE OR REPLACE FUNCTION check_generation_capacity(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage RECORD;
    user_tier pricing_tier;
    concurrent_limit INTEGER;
    current_processing INTEGER;
BEGIN
    -- Get user info
    SELECT subscription_tier INTO user_tier
    FROM profiles WHERE id = p_user_id;
    
    -- Get current period usage
    SELECT * INTO current_usage
    FROM usage 
    WHERE user_id = p_user_id 
        AND period_start <= NOW() 
        AND period_end > NOW()
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Check monthly/credit limits
    IF current_usage.videos_limit IS NOT NULL THEN
        IF current_usage.videos_generated >= current_usage.videos_limit THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Check concurrent generation limits
    CASE user_tier
        WHEN 'premium' THEN concurrent_limit := 5;
        WHEN 'basic' THEN concurrent_limit := 2;
        ELSE concurrent_limit := 1;
    END CASE;
    
    SELECT COUNT(*) INTO current_processing
    FROM videos 
    WHERE user_id = p_user_id 
        AND status IN ('pending', 'processing');
    
    IF current_processing >= concurrent_limit THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update generation queue positions
CREATE OR REPLACE FUNCTION update_generation_queue_positions()
RETURNS VOID AS $$
BEGIN
    -- Update queue positions based on priority and creation time
    WITH ranked_queue AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                ORDER BY priority ASC, created_at ASC
            ) as new_position
        FROM video_generations
        WHERE queue_position IS NULL
            OR assigned_worker IS NULL
    )
    UPDATE video_generations 
    SET queue_position = ranked_queue.new_position
    FROM ranked_queue
    WHERE video_generations.id = ranked_queue.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign video generation to worker
CREATE OR REPLACE FUNCTION assign_generation_to_worker(
    worker_name TEXT,
    max_assignments INTEGER DEFAULT 1
)
RETURNS UUID[] AS $$
DECLARE
    assigned_ids UUID[];
BEGIN
    -- Get available generations and assign to worker
    WITH available_generations AS (
        SELECT id
        FROM video_generations vg
        JOIN videos v ON vg.video_id = v.id
        WHERE vg.assigned_worker IS NULL
            AND vg.retry_after IS NULL OR vg.retry_after <= NOW()
            AND v.status = 'pending'
        ORDER BY vg.priority ASC, vg.created_at ASC
        LIMIT max_assignments
        FOR UPDATE SKIP LOCKED
    )
    UPDATE video_generations
    SET 
        assigned_worker = worker_name,
        started_at = NOW(),
        updated_at = NOW()
    FROM available_generations
    WHERE video_generations.id = available_generations.id
    RETURNING video_generations.id INTO assigned_ids;
    
    RETURN assigned_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update video generation status
CREATE OR REPLACE FUNCTION update_video_status(
    p_video_id UUID,
    p_status video_status,
    p_stage TEXT DEFAULT NULL,
    p_progress INTEGER DEFAULT NULL,
    p_estimated_time INTEGER DEFAULT NULL,
    p_error JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE videos
    SET 
        status = p_status,
        stage = COALESCE(p_stage, stage),
        progress = COALESCE(p_progress, progress),
        estimated_time_remaining = p_estimated_time,
        error = p_error,
        updated_at = NOW(),
        started_at = CASE 
            WHEN p_status = 'processing' AND started_at IS NULL 
            THEN NOW() 
            ELSE started_at 
        END,
        completed_at = CASE 
            WHEN p_status IN ('completed', 'failed', 'cancelled') 
            THEN NOW() 
            ELSE completed_at 
        END
    WHERE id = p_video_id;
    
    -- Update generation record
    UPDATE video_generations
    SET updated_at = NOW()
    WHERE video_id = p_video_id;
    
    -- If completed, update usage statistics
    IF p_status = 'completed' THEN
        PERFORM update_usage_stats(
            (SELECT user_id FROM videos WHERE id = p_video_id)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- USAGE TRACKING FUNCTIONS
-- =====================================================================================

-- Function to record usage event
CREATE OR REPLACE FUNCTION record_usage_event(
    p_user_id UUID,
    p_type usage_event_type,
    p_count INTEGER DEFAULT 1,
    p_video_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_events (
        user_id,
        subscription_id,
        type,
        count,
        video_id,
        metadata,
        timestamp
    )
    SELECT 
        p_user_id,
        s.id,
        p_type,
        p_count,
        p_video_id,
        p_metadata,
        NOW()
    FROM subscriptions s
    WHERE s.user_id = p_user_id
        AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    -- If no active subscription, still record the event
    IF NOT FOUND THEN
        INSERT INTO usage_events (
            user_id,
            type,
            count,
            video_id,
            metadata,
            timestamp
        ) VALUES (
            p_user_id,
            p_type,
            p_count,
            p_video_id,
            p_metadata,
            NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update usage statistics
CREATE OR REPLACE FUNCTION update_usage_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    current_period_start TIMESTAMPTZ := date_trunc('month', NOW());
    current_period_end TIMESTAMPTZ := (date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second');
    videos_this_period INTEGER;
BEGIN
    -- Count videos generated in current period
    SELECT COUNT(*) INTO videos_this_period
    FROM videos
    WHERE user_id = p_user_id
        AND status = 'completed'
        AND completed_at >= current_period_start
        AND completed_at <= current_period_end;
    
    -- Update or insert usage record
    INSERT INTO usage (
        user_id,
        plan,
        period_start,
        period_end,
        videos_generated,
        credits_used,
        reset_date,
        updated_at
    )
    SELECT
        p_user_id,
        subscription_tier,
        current_period_start,
        current_period_end,
        videos_this_period,
        videos_this_period, -- 1 credit per video for now
        current_period_end,
        NOW()
    FROM profiles
    WHERE id = p_user_id
    ON CONFLICT (user_id, period_start, period_end)
    DO UPDATE SET
        videos_generated = EXCLUDED.videos_generated,
        credits_used = EXCLUDED.credits_used,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Reset usage for all users with active subscriptions
    FOR user_record IN 
        SELECT DISTINCT u.user_id, p.subscription_tier
        FROM usage u
        JOIN profiles p ON u.user_id = p.id
        WHERE u.reset_date <= NOW()
    LOOP
        PERFORM initialize_user_usage(user_record.user_id, user_record.subscription_tier);
        PERFORM record_usage_event(user_record.user_id, 'subscription_reset');
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- SUBSCRIPTION MANAGEMENT FUNCTIONS
-- =====================================================================================

-- Function to handle subscription status change
CREATE OR REPLACE FUNCTION handle_subscription_change(
    p_user_id UUID,
    p_paddle_subscription_id TEXT,
    p_status subscription_status,
    p_plan pricing_tier,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    subscription_id UUID;
    old_tier pricing_tier;
BEGIN
    -- Get current tier
    SELECT subscription_tier INTO old_tier
    FROM profiles WHERE id = p_user_id;
    
    -- Update or create subscription
    INSERT INTO subscriptions (
        user_id,
        paddle_subscription_id,
        status,
        plan,
        current_period_start,
        current_period_end,
        metadata
    ) VALUES (
        p_user_id,
        p_paddle_subscription_id,
        p_status,
        p_plan,
        p_period_start,
        p_period_end,
        p_metadata
    )
    ON CONFLICT (paddle_subscription_id)
    DO UPDATE SET
        status = EXCLUDED.status,
        plan = EXCLUDED.plan,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING id INTO subscription_id;
    
    -- Update user profile
    UPDATE profiles
    SET 
        subscription_tier = p_plan,
        subscription_id = subscription_id,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Initialize usage for new plan if upgraded
    IF old_tier != p_plan THEN
        PERFORM initialize_user_usage(p_user_id, p_plan);
        PERFORM record_usage_event(
            p_user_id, 
            CASE WHEN p_plan > old_tier THEN 'upgrade' ELSE 'downgrade' END
        );
    END IF;
    
    -- Generate API key for premium users
    IF p_plan = 'premium' AND old_tier != 'premium' THEN
        PERFORM generate_user_api_key(p_user_id, 'Default API Key');
    END IF;
    
    RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel subscription
CREATE OR REPLACE FUNCTION cancel_subscription(
    p_subscription_id UUID,
    p_immediately BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
    UPDATE subscriptions
    SET
        cancel_at_period_end = NOT p_immediately,
        canceled_at = CASE WHEN p_immediately THEN NOW() ELSE NULL END,
        status = CASE WHEN p_immediately THEN 'canceled' ELSE status END,
        updated_at = NOW()
    WHERE id = p_subscription_id;
    
    -- If immediate cancellation, downgrade to pay-per-video
    IF p_immediately THEN
        UPDATE profiles
        SET 
            subscription_tier = 'pay-per-video',
            subscription_id = NULL,
            updated_at = NOW()
        WHERE subscription_id = p_subscription_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- API KEY MANAGEMENT FUNCTIONS
-- =====================================================================================

-- Function to generate API key for user
CREATE OR REPLACE FUNCTION generate_user_api_key(
    p_user_id UUID,
    p_name TEXT,
    p_permissions TEXT[] DEFAULT ARRAY['video:create', 'video:read']
)
RETURNS TEXT AS $$
DECLARE
    api_key TEXT;
    key_hash TEXT;
    key_prefix TEXT;
BEGIN
    -- Check if user has premium subscription
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND subscription_tier = 'premium'
    ) THEN
        RAISE EXCEPTION 'API keys are only available for Premium users';
    END IF;
    
    -- Generate new API key
    api_key := generate_api_key();
    key_hash := hash_api_key(api_key);
    key_prefix := get_api_key_prefix(api_key);
    
    -- Store key information
    INSERT INTO api_keys (
        user_id,
        name,
        key_hash,
        key_prefix,
        permissions
    ) VALUES (
        p_user_id,
        p_name,
        key_hash,
        key_prefix,
        p_permissions
    );
    
    -- Update profile with API key hash
    UPDATE profiles
    SET 
        api_key_hash = key_hash,
        api_key_created_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke API key
CREATE OR REPLACE FUNCTION revoke_api_key(p_key_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE api_keys
    SET 
        is_active = FALSE,
        updated_at = NOW()
    WHERE id = p_key_id AND user_id = p_user_id;
    
    -- Clear from profile if it's the main key
    UPDATE profiles
    SET 
        api_key_hash = NULL,
        api_key_created_at = NULL,
        updated_at = NOW()
    WHERE id = p_user_id
        AND api_key_hash = (
            SELECT key_hash FROM api_keys WHERE id = p_key_id
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- STORAGE CLEANUP FUNCTIONS
-- =====================================================================================

-- Function to cleanup expired videos
CREATE OR REPLACE FUNCTION cleanup_expired_videos(
    retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
    video_record RECORD;
BEGIN
    -- Find videos to cleanup (non-premium users, old failed/cancelled videos)
    FOR video_record IN
        SELECT v.id, v.video_url, v.thumbnail_url
        FROM videos v
        JOIN profiles p ON v.user_id = p.id
        WHERE 
            v.status IN ('failed', 'cancelled')
            AND v.created_at < (NOW() - INTERVAL '1 day' * retention_days)
            AND p.subscription_tier != 'premium' -- Keep premium user videos longer
    LOOP
        -- Delete associated thumbnails
        DELETE FROM thumbnails WHERE video_id = video_record.id;
        
        -- Delete the video record
        DELETE FROM videos WHERE id = video_record.id;
        
        cleanup_count := cleanup_count + 1;
    END LOOP;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup orphaned generations
CREATE OR REPLACE FUNCTION cleanup_orphaned_generations()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    -- Remove generation queue entries for deleted videos
    DELETE FROM video_generations 
    WHERE video_id NOT IN (SELECT id FROM videos);
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- ANALYTICS AND REPORTING FUNCTIONS
-- =====================================================================================

-- Function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics(
    p_user_id UUID,
    p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_videos INTEGER,
    completed_videos INTEGER,
    failed_videos INTEGER,
    total_views INTEGER,
    total_downloads INTEGER,
    avg_generation_time DECIMAL,
    favorite_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_videos,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_videos,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed_videos,
        COALESCE(SUM(view_count), 0)::INTEGER as total_views,
        COALESCE(SUM(download_count), 0)::INTEGER as total_downloads,
        COALESCE(AVG(generation_time), 0)::DECIMAL as avg_generation_time,
        COUNT(*) FILTER (WHERE is_favorite = true)::INTEGER as favorite_count
    FROM videos
    WHERE user_id = p_user_id
        AND created_at >= (NOW() - INTERVAL '1 day' * p_period_days);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system-wide analytics (admin only)
CREATE OR REPLACE FUNCTION get_system_analytics(
    p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_users INTEGER,
    active_users INTEGER,
    premium_users INTEGER,
    total_videos INTEGER,
    videos_today INTEGER,
    avg_queue_time DECIMAL,
    success_rate DECIMAL
) AS $$
BEGIN
    -- This function should have additional security checks for admin access
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER FROM profiles) as total_users,
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE last_login >= NOW() - INTERVAL '7 days') as active_users,
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE subscription_tier = 'premium') as premium_users,
        (SELECT COUNT(*)::INTEGER FROM videos WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days) as total_videos,
        (SELECT COUNT(*)::INTEGER FROM videos WHERE created_at >= CURRENT_DATE) as videos_today,
        (SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (started_at - created_at))), 0)::DECIMAL FROM videos WHERE started_at IS NOT NULL) as avg_queue_time,
        (SELECT COALESCE(
            COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 0
        )::DECIMAL FROM videos WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days) as success_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- SCHEDULED MAINTENANCE FUNCTIONS
-- =====================================================================================

-- Function to be called by cron for regular maintenance
CREATE OR REPLACE FUNCTION run_maintenance_tasks()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    cleanup_count INTEGER;
BEGIN
    -- Reset monthly usage for users past their reset date
    PERFORM reset_monthly_usage();
    result := result || 'Usage reset completed. ';
    
    -- Cleanup expired videos
    SELECT cleanup_expired_videos() INTO cleanup_count;
    result := result || format('Cleaned up %s expired videos. ', cleanup_count);
    
    -- Cleanup orphaned generations
    SELECT cleanup_orphaned_generations() INTO cleanup_count;
    result := result || format('Cleaned up %s orphaned generations. ', cleanup_count);
    
    -- Update queue positions
    PERFORM update_generation_queue_positions();
    result := result || 'Queue positions updated. ';
    
    -- Vacuum and analyze frequently updated tables
    PERFORM pg_stat_reset_single_table_counters('public'::regclass, 'videos'::regclass);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;