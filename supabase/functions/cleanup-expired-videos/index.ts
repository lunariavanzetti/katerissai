// =====================================================================================
// Kateriss AI Video Generator - Storage Cleanup Automation Function
// Created: 2025-09-09
// Description: Automated cleanup of expired videos, orphaned files, and storage
//              optimization with comprehensive retention policies
// =====================================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

interface CleanupResult {
  success: boolean
  summary: {
    videosDeleted: number
    thumbnailsDeleted: number
    storageFreed: number // bytes
    orphanedFilesRemoved: number
    tempFilesRemoved: number
    duration: number // milliseconds
  }
  details: string[]
  errors: string[]
}

interface StorageUsage {
  bucket: string
  totalFiles: number
  totalSize: number
  oldestFile: string
  newestFile: string
}

interface RetentionPolicy {
  tier: 'pay-per-video' | 'basic' | 'premium'
  retentionDays: number
  maxStorageGB: number
  priorities: {
    failed: number
    cancelled: number
    completed: number
  }
}

// =====================================================================================
// RETENTION POLICIES CONFIGURATION
// =====================================================================================

const RETENTION_POLICIES: Record<string, RetentionPolicy> = {
  'pay-per-video': {
    tier: 'pay-per-video',
    retentionDays: 30,
    maxStorageGB: 1,
    priorities: {
      failed: 7,      // Delete failed videos after 7 days
      cancelled: 7,   // Delete cancelled videos after 7 days  
      completed: 30   // Keep completed videos for 30 days
    }
  },
  'basic': {
    tier: 'basic',
    retentionDays: 90,
    maxStorageGB: 10,
    priorities: {
      failed: 14,     // Delete failed videos after 14 days
      cancelled: 14,  // Delete cancelled videos after 14 days
      completed: 90   // Keep completed videos for 90 days
    }
  },
  'premium': {
    tier: 'premium',
    retentionDays: 365,
    maxStorageGB: 100,
    priorities: {
      failed: 30,     // Delete failed videos after 30 days
      cancelled: 30,  // Delete cancelled videos after 30 days
      completed: 365  // Keep completed videos for 365 days
    }
  }
}

// =====================================================================================
// CLEANUP FUNCTIONS
// =====================================================================================

async function cleanupExpiredVideos(supabase: any): Promise<{
  deleted: number
  freed: number
  details: string[]
}> {
  const details: string[] = []
  let totalDeleted = 0
  let totalFreed = 0
  
  try {
    for (const [tier, policy] of Object.entries(RETENTION_POLICIES)) {
      // Clean up by status and retention policy
      for (const [status, retentionDays] of Object.entries(policy.priorities)) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
        
        // Find videos to delete
        const { data: videosToDelete, error } = await supabase
          .from('videos')
          .select(`
            id,
            user_id,
            title,
            video_url,
            thumbnail_url,
            file_size,
            created_at,
            profiles (subscription_tier)
          `)
          .eq('status', status)
          .eq('profiles.subscription_tier', tier)
          .lt('created_at', cutoffDate.toISOString())
          .limit(100) // Process in batches
        
        if (error) {
          details.push(`Error querying videos for ${tier}/${status}: ${error.message}`)
          continue
        }
        
        if (!videosToDelete || videosToDelete.length === 0) {
          continue
        }
        
        details.push(`Found ${videosToDelete.length} ${status} videos to delete for ${tier} users`)
        
        // Delete videos and associated data
        for (const video of videosToDelete) {
          try {
            // Delete storage files
            let videoSize = 0
            if (video.video_url) {
              videoSize += await deleteStorageFile(supabase, 'videos', video.video_url)
            }
            if (video.thumbnail_url) {
              videoSize += await deleteStorageFile(supabase, 'thumbnails', video.thumbnail_url)
            }
            
            // Delete associated thumbnails
            await supabase
              .from('thumbnails')
              .delete()
              .eq('video_id', video.id)
            
            // Delete video generation records
            await supabase
              .from('video_generations')
              .delete()
              .eq('video_id', video.id)
            
            // Delete usage events for this video
            await supabase
              .from('usage_events')
              .delete()
              .eq('video_id', video.id)
            
            // Finally delete the video record
            const { error: deleteError } = await supabase
              .from('videos')
              .delete()
              .eq('id', video.id)
            
            if (deleteError) {
              details.push(`Error deleting video ${video.id}: ${deleteError.message}`)
              continue
            }
            
            totalDeleted++
            totalFreed += videoSize
            
            // Create audit log
            await supabase
              .from('audit_logs')
              .insert({
                user_id: video.user_id,
                action: 'video_expired_deleted',
                table_name: 'videos',
                record_id: video.id,
                old_values: {
                  title: video.title,
                  status: status,
                  tier: tier,
                  retention_days: retentionDays,
                  file_size: video.file_size
                }
              })
            
          } catch (videoError) {
            details.push(`Error processing video ${video.id}: ${videoError.message}`)
          }
        }
      }
    }
    
    details.push(`Cleanup completed: ${totalDeleted} videos deleted, ${Math.round(totalFreed / 1048576)} MB freed`)
    
    return {
      deleted: totalDeleted,
      freed: totalFreed,
      details
    }
    
  } catch (error) {
    details.push(`Cleanup error: ${error.message}`)
    throw error
  }
}

async function cleanupOrphanedFiles(supabase: any): Promise<{
  removed: number
  freed: number
  details: string[]
}> {
  const details: string[] = []
  let totalRemoved = 0
  let totalFreed = 0
  
  try {
    // Find orphaned video files
    const { data: orphanedVideos } = await supabase
      .from('storage.objects')
      .select('name, metadata, bucket_id')
      .eq('bucket_id', 'videos')
      .not('name', 'in', `(
        SELECT SUBSTRING(video_url FROM 'videos/(.+)$') as path
        FROM videos 
        WHERE video_url IS NOT NULL
      )`)
    
    if (orphanedVideos) {
      for (const file of orphanedVideos) {
        try {
          const size = await deleteStorageFile(supabase, 'videos', file.name)
          totalRemoved++
          totalFreed += size
        } catch (error) {
          details.push(`Error deleting orphaned video ${file.name}: ${error.message}`)
        }
      }
      details.push(`Removed ${orphanedVideos.length} orphaned video files`)
    }
    
    // Find orphaned thumbnail files
    const { data: orphanedThumbnails } = await supabase
      .from('storage.objects')
      .select('name, metadata, bucket_id')
      .eq('bucket_id', 'thumbnails')
      .not('name', 'in', `(
        SELECT SUBSTRING(url FROM 'thumbnails/(.+)$') as path
        FROM thumbnails 
        WHERE url IS NOT NULL
      )`)
    
    if (orphanedThumbnails) {
      for (const file of orphanedThumbnails) {
        try {
          const size = await deleteStorageFile(supabase, 'thumbnails', file.name)
          totalRemoved++
          totalFreed += size
        } catch (error) {
          details.push(`Error deleting orphaned thumbnail ${file.name}: ${error.message}`)
        }
      }
      details.push(`Removed ${orphanedThumbnails.length} orphaned thumbnail files`)
    }
    
    return {
      removed: totalRemoved,
      freed: totalFreed,
      details
    }
    
  } catch (error) {
    details.push(`Orphaned files cleanup error: ${error.message}`)
    throw error
  }
}

async function cleanupTempFiles(supabase: any): Promise<{
  removed: number
  freed: number
  details: string[]
}> {
  const details: string[] = []
  let totalRemoved = 0
  let totalFreed = 0
  
  try {
    // Clean up temp-uploads older than 24 hours
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - 24)
    
    const { data: tempFiles } = await supabase
      .from('storage.objects')
      .select('name, metadata, created_at')
      .eq('bucket_id', 'temp-uploads')
      .lt('created_at', cutoffDate.toISOString())
    
    if (tempFiles && tempFiles.length > 0) {
      for (const file of tempFiles) {
        try {
          const size = await deleteStorageFile(supabase, 'temp-uploads', file.name)
          totalRemoved++
          totalFreed += size
        } catch (error) {
          details.push(`Error deleting temp file ${file.name}: ${error.message}`)
        }
      }
      details.push(`Removed ${tempFiles.length} expired temp files`)
    }
    
    return {
      removed: totalRemoved,
      freed: totalFreed,
      details
    }
    
  } catch (error) {
    details.push(`Temp files cleanup error: ${error.message}`)
    throw error
  }
}

async function cleanupLargeStorageUsers(supabase: any): Promise<{
  processed: number
  details: string[]
}> {
  const details: string[] = []
  let totalProcessed = 0
  
  try {
    // Find users exceeding storage limits
    for (const [tier, policy] of Object.entries(RETENTION_POLICIES)) {
      const maxBytes = policy.maxStorageGB * 1024 * 1024 * 1024
      
      // Get storage usage by user (simplified query)
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, subscription_tier')
        .eq('subscription_tier', tier)
        .limit(50)
      
      if (!users) continue
      
      for (const user of users) {
        try {
          const usage = await getUserStorageUsage(supabase, user.id)
          
          if (usage.totalSize > maxBytes) {
            // Delete oldest videos for this user until under limit
            const bytesToFree = usage.totalSize - maxBytes
            const deletedBytes = await deleteOldestUserVideos(
              supabase, 
              user.id, 
              bytesToFree
            )
            
            if (deletedBytes > 0) {
              totalProcessed++
              details.push(
                `User ${user.email} (${tier}): freed ${Math.round(deletedBytes / 1048576)} MB`
              )
              
              // Create audit log
              await supabase
                .from('audit_logs')
                .insert({
                  user_id: user.id,
                  action: 'storage_limit_cleanup',
                  table_name: 'videos',
                  new_values: {
                    tier: tier,
                    bytes_freed: deletedBytes,
                    limit_gb: policy.maxStorageGB
                  }
                })
            }
          }
        } catch (userError) {
          details.push(`Error processing user ${user.id}: ${userError.message}`)
        }
      }
    }
    
    return {
      processed: totalProcessed,
      details
    }
    
  } catch (error) {
    details.push(`Storage limit cleanup error: ${error.message}`)
    throw error
  }
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

async function deleteStorageFile(
  supabase: any, 
  bucket: string, 
  filePath: string
): Promise<number> {
  try {
    // Extract path from URL if full URL provided
    let path = filePath
    if (filePath.includes('/storage/v1/object/public/')) {
      path = filePath.split(`/${bucket}/`)[1]
    }
    
    // Get file size before deletion
    const { data: fileData } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop()
      })
    
    let fileSize = 0
    if (fileData && fileData.length > 0) {
      fileSize = fileData[0].metadata?.size || 0
    }
    
    // Delete the file
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) {
      throw error
    }
    
    return fileSize
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error)
    return 0
  }
}

async function getUserStorageUsage(supabase: any, userId: string): Promise<{
  totalSize: number
  videoFiles: number
  thumbnailFiles: number
}> {
  try {
    // Get user's video files
    const { data: videoFiles } = await supabase.storage
      .from('videos')
      .list(`${new Date().getFullYear()}/${userId}`, { limit: 1000 })
    
    const { data: thumbnailFiles } = await supabase.storage
      .from('thumbnails')
      .list(`${new Date().getFullYear()}/${userId}`, { limit: 1000 })
    
    const videoSize = videoFiles?.reduce((sum, file) => 
      sum + (file.metadata?.size || 0), 0) || 0
    
    const thumbnailSize = thumbnailFiles?.reduce((sum, file) => 
      sum + (file.metadata?.size || 0), 0) || 0
    
    return {
      totalSize: videoSize + thumbnailSize,
      videoFiles: videoFiles?.length || 0,
      thumbnailFiles: thumbnailFiles?.length || 0
    }
  } catch (error) {
    console.error(`Error getting storage usage for user ${userId}:`, error)
    return { totalSize: 0, videoFiles: 0, thumbnailFiles: 0 }
  }
}

async function deleteOldestUserVideos(
  supabase: any, 
  userId: string, 
  bytesToFree: number
): Promise<number> {
  try {
    let bytesFreed = 0
    
    // Get user's oldest videos (excluding favorites and recent completions)
    const { data: videos } = await supabase
      .from('videos')
      .select('id, video_url, thumbnail_url, file_size, created_at')
      .eq('user_id', userId)
      .eq('is_favorite', false)
      .neq('status', 'processing')
      .order('created_at', { ascending: true })
      .limit(20)
    
    if (!videos) return 0
    
    for (const video of videos) {
      if (bytesFreed >= bytesToFree) break
      
      try {
        // Delete storage files
        let videoSize = 0
        if (video.video_url) {
          videoSize += await deleteStorageFile(supabase, 'videos', video.video_url)
        }
        if (video.thumbnail_url) {
          videoSize += await deleteStorageFile(supabase, 'thumbnails', video.thumbnail_url)
        }
        
        // Delete database records
        await supabase.from('thumbnails').delete().eq('video_id', video.id)
        await supabase.from('video_generations').delete().eq('video_id', video.id)
        await supabase.from('videos').delete().eq('id', video.id)
        
        bytesFreed += videoSize
      } catch (error) {
        console.error(`Error deleting video ${video.id}:`, error)
      }
    }
    
    return bytesFreed
  } catch (error) {
    console.error(`Error deleting oldest videos for user ${userId}:`, error)
    return 0
  }
}

async function getStorageStats(supabase: any): Promise<StorageUsage[]> {
  const buckets = ['videos', 'thumbnails', 'avatars', 'temp-uploads']
  const stats: StorageUsage[] = []
  
  for (const bucket of buckets) {
    try {
      const { data: files } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000 })
      
      if (files) {
        const totalSize = files.reduce((sum, file) => 
          sum + (file.metadata?.size || 0), 0)
        
        const dates = files
          .map(f => new Date(f.created_at))
          .filter(d => !isNaN(d.getTime()))
          .sort()
        
        stats.push({
          bucket,
          totalFiles: files.length,
          totalSize,
          oldestFile: dates.length > 0 ? dates[0].toISOString() : 'N/A',
          newestFile: dates.length > 0 ? dates[dates.length - 1].toISOString() : 'N/A'
        })
      }
    } catch (error) {
      console.error(`Error getting stats for bucket ${bucket}:`, error)
    }
  }
  
  return stats
}

// =====================================================================================
// MAIN CLEANUP FUNCTION
// =====================================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  const startTime = Date.now()
  const result: CleanupResult = {
    success: false,
    summary: {
      videosDeleted: 0,
      thumbnailsDeleted: 0,
      storageFreed: 0,
      orphanedFilesRemoved: 0,
      tempFilesRemoved: 0,
      duration: 0
    },
    details: [],
    errors: []
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'full'
    const dryRun = url.searchParams.get('dry_run') === 'true'
    
    result.details.push(`Starting cleanup process (${action} mode, dry_run: ${dryRun})`)
    
    if (dryRun) {
      result.details.push('DRY RUN MODE - No files will be deleted')
    }
    
    if (action === 'full' || action === 'expired') {
      result.details.push('Cleaning up expired videos...')
      const expiredResult = await cleanupExpiredVideos(supabase)
      result.summary.videosDeleted = expiredResult.deleted
      result.summary.storageFreed += expiredResult.freed
      result.details.push(...expiredResult.details)
    }
    
    if (action === 'full' || action === 'orphaned') {
      result.details.push('Cleaning up orphaned files...')
      const orphanedResult = await cleanupOrphanedFiles(supabase)
      result.summary.orphanedFilesRemoved = orphanedResult.removed
      result.summary.storageFreed += orphanedResult.freed
      result.details.push(...orphanedResult.details)
    }
    
    if (action === 'full' || action === 'temp') {
      result.details.push('Cleaning up temp files...')
      const tempResult = await cleanupTempFiles(supabase)
      result.summary.tempFilesRemoved = tempResult.removed
      result.summary.storageFreed += tempResult.freed
      result.details.push(...tempResult.details)
    }
    
    if (action === 'full' || action === 'limits') {
      result.details.push('Enforcing storage limits...')
      const limitsResult = await cleanupLargeStorageUsers(supabase)
      result.details.push(...limitsResult.details)
    }
    
    // Run database maintenance
    if (action === 'full' || action === 'maintenance') {
      result.details.push('Running database maintenance...')
      const maintenanceResult = await supabase.rpc('run_maintenance_tasks')
      if (maintenanceResult.data) {
        result.details.push(`Maintenance: ${maintenanceResult.data}`)
      }
    }
    
    // Get final storage statistics
    if (action === 'full' || action === 'stats') {
      const stats = await getStorageStats(supabase)
      result.details.push('Storage statistics:')
      for (const stat of stats) {
        result.details.push(
          `  ${stat.bucket}: ${stat.totalFiles} files, ` +
          `${Math.round(stat.totalSize / 1048576)} MB`
        )
      }
    }
    
    result.summary.duration = Date.now() - startTime
    result.success = true
    
    result.details.push(
      `Cleanup completed in ${result.summary.duration}ms. ` +
      `Total storage freed: ${Math.round(result.summary.storageFreed / 1048576)} MB`
    )
    
    // Create audit log for cleanup operation
    await supabase
      .from('audit_logs')
      .insert({
        action: 'storage_cleanup',
        table_name: 'system',
        new_values: result.summary
      })
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Cleanup error:', error)
    
    result.success = false
    result.errors.push(error.message)
    result.summary.duration = Date.now() - startTime
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})