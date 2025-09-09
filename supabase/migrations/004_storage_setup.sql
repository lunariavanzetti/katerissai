-- =====================================================================================
-- Kateriss AI Video Generator - Storage Configuration
-- Created: 2025-09-09
-- Description: Storage buckets, policies, and configuration for video files,
--              thumbnails, and user uploads with comprehensive security
-- =====================================================================================

-- =====================================================================================
-- STORAGE BUCKETS CREATION
-- =====================================================================================

-- Create videos bucket for generated video files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos',
    false, -- Private by default
    1073741824, -- 1GB limit per file
    ARRAY[
        'video/mp4',
        'video/quicktime',
        'video/webm',
        'video/x-msvideo',
        'video/mpeg'
    ]
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create thumbnails bucket for video preview images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'thumbnails',
    'thumbnails', 
    true, -- Public for easy access
    10485760, -- 10MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
    ]
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true, -- Public for profile display
    5242880, -- 5MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create temp-uploads bucket for temporary file processing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'temp-uploads',
    'temp-uploads',
    false, -- Private
    104857600, -- 100MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/quicktime',
        'video/webm',
        'application/json',
        'text/plain'
    ]
) ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================================================
-- STORAGE UTILITY FUNCTIONS
-- =====================================================================================

-- Function to generate storage path for videos
CREATE OR REPLACE FUNCTION get_video_storage_path(
    user_id UUID,
    video_id UUID,
    file_extension TEXT DEFAULT 'mp4'
)
RETURNS TEXT AS $$
BEGIN
    RETURN format(
        '%s/%s/%s.%s',
        DATE_PART('year', NOW()),
        user_id,
        video_id,
        file_extension
    );
END;
$$ LANGUAGE plpgsql;

-- Function to generate storage path for thumbnails  
CREATE OR REPLACE FUNCTION get_thumbnail_storage_path(
    user_id UUID,
    video_id UUID,
    thumbnail_id UUID,
    file_extension TEXT DEFAULT 'jpg'
)
RETURNS TEXT AS $$
BEGIN
    RETURN format(
        '%s/%s/%s/%s.%s',
        DATE_PART('year', NOW()),
        user_id,
        video_id,
        thumbnail_id,
        file_extension
    );
END;
$$ LANGUAGE plpgsql;

-- Function to generate storage path for avatars
CREATE OR REPLACE FUNCTION get_avatar_storage_path(
    user_id UUID,
    file_extension TEXT DEFAULT 'jpg'
)
RETURNS TEXT AS $$
BEGIN
    RETURN format(
        '%s.%s',
        user_id,
        file_extension
    );
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup storage objects
CREATE OR REPLACE FUNCTION cleanup_storage_object(
    bucket_name TEXT,
    object_path TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    cleanup_success BOOLEAN := FALSE;
BEGIN
    -- Delete object from storage
    DELETE FROM storage.objects
    WHERE bucket_id = bucket_name AND name = object_path;
    
    GET DIAGNOSTICS cleanup_success = FOUND;
    RETURN cleanup_success;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail
        INSERT INTO audit_logs (action, table_name, new_values)
        VALUES (
            'storage_cleanup_error',
            'storage.objects',
            jsonb_build_object(
                'bucket', bucket_name,
                'path', object_path,
                'error', SQLERRM
            )
        );
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- STORAGE POLICIES FOR VIDEOS BUCKET
-- =====================================================================================

-- Users can view their own videos
CREATE POLICY "Users can view own videos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'videos' 
        AND auth.uid()::text = (storage.foldername(name))[2]
    );

-- Users can upload to their own video folder
CREATE POLICY "Users can upload own videos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'videos'
        AND auth.uid()::text = (storage.foldername(name))[2]
        AND (storage.extension(name)) = ANY(ARRAY['mp4', 'mov', 'webm', 'avi'])
    );

-- Users can update their own video metadata
CREATE POLICY "Users can update own videos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'videos'
        AND auth.uid()::text = (storage.foldername(name))[2]
    ) WITH CHECK (
        bucket_id = 'videos'
        AND auth.uid()::text = (storage.foldername(name))[2]
    );

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'videos'
        AND auth.uid()::text = (storage.foldername(name))[2]
    );

-- System can manage video files (for processing)
CREATE POLICY "System can manage video files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'videos'
        AND (
            auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Public access to videos marked as public
CREATE POLICY "Public videos are viewable" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'videos'
        AND EXISTS (
            SELECT 1 FROM videos v
            WHERE v.video_url LIKE '%' || name || '%'
                AND v.is_public = true
        )
    );

-- =====================================================================================
-- STORAGE POLICIES FOR THUMBNAILS BUCKET
-- =====================================================================================

-- Thumbnails are publicly readable (bucket is public)
CREATE POLICY "Thumbnails are publicly readable" ON storage.objects
    FOR SELECT USING (bucket_id = 'thumbnails');

-- Users can upload thumbnails for their own videos
CREATE POLICY "Users can upload own thumbnails" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'thumbnails'
        AND auth.uid()::text = (storage.foldername(name))[2]
        AND (storage.extension(name)) = ANY(ARRAY['jpg', 'jpeg', 'png', 'webp', 'gif'])
    );

-- Users can update their own thumbnails
CREATE POLICY "Users can update own thumbnails" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'thumbnails'
        AND auth.uid()::text = (storage.foldername(name))[2]
    ) WITH CHECK (
        bucket_id = 'thumbnails'
        AND auth.uid()::text = (storage.foldername(name))[2]
    );

-- Users can delete their own thumbnails
CREATE POLICY "Users can delete own thumbnails" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'thumbnails'
        AND auth.uid()::text = (storage.foldername(name))[2]
    );

-- System can manage all thumbnails
CREATE POLICY "System can manage thumbnails" ON storage.objects
    FOR ALL USING (
        bucket_id = 'thumbnails'
        AND (
            auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- =====================================================================================
-- STORAGE POLICIES FOR AVATARS BUCKET
-- =====================================================================================

-- Avatars are publicly readable (bucket is public)
CREATE POLICY "Avatars are publicly readable" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.filename(name))
        AND (storage.extension(name)) = ANY(ARRAY['jpg', 'jpeg', 'png', 'webp'])
    );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.filename(name))
    ) WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.filename(name))
    );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.filename(name))
    );

-- =====================================================================================
-- STORAGE POLICIES FOR TEMP-UPLOADS BUCKET
-- =====================================================================================

-- Users can manage their own temp uploads
CREATE POLICY "Users can manage own temp uploads" ON storage.objects
    FOR ALL USING (
        bucket_id = 'temp-uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    ) WITH CHECK (
        bucket_id = 'temp-uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Temp uploads auto-expire after 24 hours
CREATE POLICY "Temp uploads auto-expire" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'temp-uploads'
        AND created_at < (NOW() - INTERVAL '24 hours')
    );

-- System can manage all temp uploads
CREATE POLICY "System can manage temp uploads" ON storage.objects
    FOR ALL USING (
        bucket_id = 'temp-uploads'
        AND (
            auth.jwt() ->> 'iss' = 'https://your-project.supabase.co/auth/v1'
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- =====================================================================================
-- STORAGE WEBHOOK AND TRIGGER FUNCTIONS
-- =====================================================================================

-- Function to handle video upload completion
CREATE OR REPLACE FUNCTION handle_video_upload()
RETURNS TRIGGER AS $$
DECLARE
    video_uuid UUID;
    user_uuid UUID;
    file_path TEXT;
BEGIN
    -- Only process videos bucket uploads
    IF NEW.bucket_id != 'videos' THEN
        RETURN NEW;
    END IF;
    
    -- Extract video ID and user ID from path
    file_path := NEW.name;
    
    -- Parse path: year/user_id/video_id.extension
    BEGIN
        video_uuid := (string_to_array(file_path, '/'))[3];
        user_uuid := (string_to_array(file_path, '/'))[2]::UUID;
        video_uuid := (split_part(video_uuid, '.', 1))::UUID;
    EXCEPTION
        WHEN OTHERS THEN
            -- Invalid path format, skip processing
            RETURN NEW;
    END;
    
    -- Update video record with storage URL
    UPDATE videos
    SET 
        video_url = format('https://your-project.supabase.co/storage/v1/object/public/videos/%s', NEW.name),
        file_size = NEW.metadata ->> 'size',
        format = storage.extension(NEW.name),
        updated_at = NOW()
    WHERE id = video_uuid AND user_id = user_uuid;
    
    -- Create audit log
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
        user_uuid,
        'video_uploaded',
        'storage.objects',
        NEW.id,
        to_jsonb(NEW)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle thumbnail upload completion
CREATE OR REPLACE FUNCTION handle_thumbnail_upload()
RETURNS TRIGGER AS $$
DECLARE
    video_uuid UUID;
    user_uuid UUID;
    thumbnail_uuid UUID;
    file_path TEXT;
BEGIN
    -- Only process thumbnails bucket uploads
    IF NEW.bucket_id != 'thumbnails' THEN
        RETURN NEW;
    END IF;
    
    -- Extract IDs from path
    file_path := NEW.name;
    
    -- Parse path: year/user_id/video_id/thumbnail_id.extension
    BEGIN
        user_uuid := (string_to_array(file_path, '/'))[2]::UUID;
        video_uuid := (string_to_array(file_path, '/'))[3]::UUID;
        thumbnail_uuid := (split_part((string_to_array(file_path, '/'))[4], '.', 1))::UUID;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN NEW;
    END;
    
    -- Update or create thumbnail record
    INSERT INTO thumbnails (
        id,
        video_id,
        url,
        width,
        height,
        format,
        file_size,
        is_default
    )
    SELECT
        thumbnail_uuid,
        video_uuid,
        format('https://your-project.supabase.co/storage/v1/object/public/thumbnails/%s', NEW.name),
        COALESCE((NEW.metadata ->> 'width')::INTEGER, 1920),
        COALESCE((NEW.metadata ->> 'height')::INTEGER, 1080),
        storage.extension(NEW.name),
        COALESCE((NEW.metadata ->> 'size')::BIGINT, 0),
        NOT EXISTS (SELECT 1 FROM thumbnails WHERE video_id = video_uuid)
    ON CONFLICT (id) DO UPDATE SET
        url = EXCLUDED.url,
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        format = EXCLUDED.format,
        file_size = EXCLUDED.file_size;
    
    -- Update video thumbnail_url if this is the default thumbnail
    UPDATE videos
    SET 
        thumbnail_url = format('https://your-project.supabase.co/storage/v1/object/public/thumbnails/%s', NEW.name),
        updated_at = NOW()
    WHERE id = video_uuid 
        AND thumbnail_url IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup storage when video is deleted
CREATE OR REPLACE FUNCTION cleanup_video_storage()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up video file
    IF OLD.video_url IS NOT NULL THEN
        PERFORM cleanup_storage_object(
            'videos',
            regexp_replace(OLD.video_url, '^.*/storage/v1/object/public/videos/', '')
        );
    END IF;
    
    -- Clean up thumbnail files
    PERFORM cleanup_storage_object(
        'thumbnails',
        regexp_replace(t.url, '^.*/storage/v1/object/public/thumbnails/', '')
    )
    FROM thumbnails t
    WHERE t.video_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- STORAGE TRIGGERS
-- =====================================================================================

-- Trigger for video upload handling
CREATE TRIGGER on_video_uploaded
    AFTER INSERT ON storage.objects
    FOR EACH ROW
    WHEN (NEW.bucket_id = 'videos')
    EXECUTE FUNCTION handle_video_upload();

-- Trigger for thumbnail upload handling  
CREATE TRIGGER on_thumbnail_uploaded
    AFTER INSERT ON storage.objects
    FOR EACH ROW
    WHEN (NEW.bucket_id = 'thumbnails')
    EXECUTE FUNCTION handle_thumbnail_upload();

-- Trigger for storage cleanup when video deleted
CREATE TRIGGER on_video_deleted_cleanup_storage
    AFTER DELETE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_video_storage();

-- =====================================================================================
-- STORAGE MANAGEMENT FUNCTIONS
-- =====================================================================================

-- Function to get storage usage by user
CREATE OR REPLACE FUNCTION get_user_storage_usage(p_user_id UUID)
RETURNS TABLE (
    video_files INTEGER,
    video_size_mb DECIMAL,
    thumbnail_files INTEGER,
    thumbnail_size_mb DECIMAL,
    total_size_mb DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(v.file_count, 0)::INTEGER as video_files,
        COALESCE(v.total_size_mb, 0)::DECIMAL as video_size_mb,
        COALESCE(t.file_count, 0)::INTEGER as thumbnail_files,
        COALESCE(t.total_size_mb, 0)::DECIMAL as thumbnail_size_mb,
        COALESCE(v.total_size_mb, 0)::DECIMAL + COALESCE(t.total_size_mb, 0)::DECIMAL as total_size_mb
    FROM (
        SELECT 
            COUNT(*) as file_count,
            SUM((metadata ->> 'size')::BIGINT) / 1048576.0 as total_size_mb
        FROM storage.objects
        WHERE bucket_id = 'videos'
            AND auth.uid()::text = (storage.foldername(name))[2]
    ) v
    CROSS JOIN (
        SELECT 
            COUNT(*) as file_count,
            SUM((metadata ->> 'size')::BIGINT) / 1048576.0 as total_size_mb
        FROM storage.objects
        WHERE bucket_id = 'thumbnails'
            AND auth.uid()::text = (storage.foldername(name))[2]
    ) t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired temp uploads
CREATE OR REPLACE FUNCTION cleanup_temp_uploads()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    -- Delete expired temp uploads
    DELETE FROM storage.objects
    WHERE bucket_id = 'temp-uploads'
        AND created_at < (NOW() - INTERVAL '24 hours');
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate old storage paths (if needed)
CREATE OR REPLACE FUNCTION migrate_storage_paths()
RETURNS TEXT AS $$
DECLARE
    migration_count INTEGER := 0;
    video_record RECORD;
BEGIN
    -- Update old video URLs to new format
    FOR video_record IN
        SELECT id, video_url, user_id
        FROM videos
        WHERE video_url IS NOT NULL
            AND video_url NOT LIKE '%/storage/v1/object/public/%'
    LOOP
        -- Update to new URL format
        UPDATE videos
        SET 
            video_url = format(
                'https://your-project.supabase.co/storage/v1/object/public/videos/%s',
                get_video_storage_path(video_record.user_id, video_record.id)
            ),
            updated_at = NOW()
        WHERE id = video_record.id;
        
        migration_count := migration_count + 1;
    END LOOP;
    
    RETURN format('Migrated %s video URLs', migration_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- STORAGE CONFIGURATION TABLE
-- =====================================================================================

-- Add storage configuration to app_config
INSERT INTO app_config (key, value, description) VALUES 
('storage_limits', '{
    "pay-per-video": {"total_gb": 1, "retention_days": 30},
    "basic": {"total_gb": 10, "retention_days": 90},
    "premium": {"total_gb": 100, "retention_days": 365}
}', 'Storage limits and retention by subscription tier'),
('storage_settings', '{
    "video_formats": ["mp4", "mov", "webm", "avi"],
    "thumbnail_formats": ["jpg", "jpeg", "png", "webp", "gif"],
    "max_file_sizes": {
        "video": 1073741824,
        "thumbnail": 10485760,
        "avatar": 5242880
    },
    "cdn_enabled": true,
    "compression_enabled": true
}', 'General storage configuration settings')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Create indexes for storage objects queries
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_user 
ON storage.objects (bucket_id, ((storage.foldername(name))[2]));

CREATE INDEX IF NOT EXISTS idx_storage_objects_created_at 
ON storage.objects (created_at);

CREATE INDEX IF NOT EXISTS idx_storage_objects_metadata_size 
ON storage.objects USING gin (metadata) 
WHERE metadata ? 'size';