// =====================================================================================
// Kateriss AI Video Generator - Video Generation Processing Function
// Created: 2025-09-09
// Description: Queue processing function for managing video generation workflow,
//              AI integration, status updates, and error handling
// =====================================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

interface VideoGenerationRequest {
  videoId: string
  userId: string
  prompt: string
  settings: {
    duration?: number
    resolution?: string
    style?: string
    aspectRatio?: string
    seed?: number
  }
  priority: number
}

interface GenerationStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  stage: string
  progress: number
  estimatedTimeRemaining?: number
  error?: any
}

interface AIGenerationResponse {
  success: boolean
  jobId?: string
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  error?: string
}

// =====================================================================================
// AI SERVICE INTEGRATION
// =====================================================================================

async function callVeoAI(prompt: string, settings: any): Promise<AIGenerationResponse> {
  try {
    // This would integrate with Google's Veo AI or similar service
    const veoApiKey = Deno.env.get('VEO_API_KEY')!
    const veoEndpoint = Deno.env.get('VEO_ENDPOINT')!
    
    const requestBody = {
      prompt: prompt,
      duration: settings.duration || 5,
      resolution: settings.resolution || '1080p',
      style: settings.style || 'realistic',
      aspect_ratio: settings.aspectRatio || '16:9',
      seed: settings.seed
    }
    
    console.log('Calling Veo AI with:', requestBody)
    
    const response = await fetch(veoEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${veoApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      throw new Error(`Veo AI API error: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    return {
      success: true,
      jobId: result.job_id,
      videoUrl: result.video_url,
      thumbnailUrl: result.thumbnail_url,
      duration: result.duration
    }
    
  } catch (error) {
    console.error('Veo AI integration error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function checkVeoJobStatus(jobId: string): Promise<AIGenerationResponse> {
  try {
    const veoApiKey = Deno.env.get('VEO_API_KEY')!
    const veoStatusEndpoint = `${Deno.env.get('VEO_ENDPOINT')}/jobs/${jobId}`
    
    const response = await fetch(veoStatusEndpoint, {
      headers: {
        'Authorization': `Bearer ${veoApiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Veo status check error: ${response.status}`)
    }
    
    const result = await response.json()
    
    return {
      success: result.status === 'completed',
      jobId: jobId,
      videoUrl: result.video_url,
      thumbnailUrl: result.thumbnail_url,
      duration: result.duration,
      error: result.status === 'failed' ? result.error : undefined
    }
    
  } catch (error) {
    console.error('Veo status check error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// =====================================================================================
// VIDEO PROCESSING FUNCTIONS
// =====================================================================================

async function startVideoGeneration(
  supabase: any,
  request: VideoGenerationRequest
): Promise<GenerationStatus> {
  try {
    // Update video status to processing
    await updateVideoStatus(supabase, request.videoId, {
      status: 'processing',
      stage: 'initializing',
      progress: 5
    })
    
    // Enhanced prompt processing
    const enhancedPrompt = await enhancePrompt(request.prompt, request.settings)
    
    await updateVideoStatus(supabase, request.videoId, {
      status: 'processing',
      stage: 'generating',
      progress: 10
    })
    
    // Call AI service
    const aiResult = await callVeoAI(enhancedPrompt, request.settings)
    
    if (!aiResult.success) {
      throw new Error(aiResult.error || 'AI generation failed')
    }
    
    // Update with job ID for tracking
    await supabase
      .from('videos')
      .update({
        veo_job_id: aiResult.jobId,
        enhanced_prompt: enhancedPrompt,
        stage: 'ai_processing',
        progress: 20,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.videoId)
    
    return {
      status: 'processing',
      stage: 'ai_processing',
      progress: 20
    }
    
  } catch (error) {
    console.error('Video generation start error:', error)
    
    await updateVideoStatus(supabase, request.videoId, {
      status: 'failed',
      stage: 'error',
      progress: 0,
      error: { message: error.message, timestamp: new Date().toISOString() }
    })
    
    return {
      status: 'failed',
      stage: 'error',
      progress: 0,
      error: error.message
    }
  }
}

async function checkGenerationProgress(
  supabase: any,
  videoId: string,
  jobId: string
): Promise<GenerationStatus> {
  try {
    const statusResult = await checkVeoJobStatus(jobId)
    
    if (statusResult.success && statusResult.videoUrl) {
      // Generation completed successfully
      await processCompletedVideo(supabase, videoId, statusResult)
      
      return {
        status: 'completed',
        stage: 'completed',
        progress: 100
      }
      
    } else if (statusResult.error) {
      // Generation failed
      await updateVideoStatus(supabase, videoId, {
        status: 'failed',
        stage: 'ai_error',
        progress: 0,
        error: { message: statusResult.error, timestamp: new Date().toISOString() }
      })
      
      return {
        status: 'failed',
        stage: 'ai_error',
        progress: 0,
        error: statusResult.error
      }
      
    } else {
      // Still processing, estimate progress
      const progressEstimate = Math.min(90, 20 + Math.random() * 50)
      
      await updateVideoStatus(supabase, videoId, {
        status: 'processing',
        stage: 'ai_processing',
        progress: Math.floor(progressEstimate)
      })
      
      return {
        status: 'processing',
        stage: 'ai_processing',
        progress: Math.floor(progressEstimate)
      }
    }
    
  } catch (error) {
    console.error('Progress check error:', error)
    return {
      status: 'processing',
      stage: 'ai_processing',
      progress: 50 // Keep current progress if check fails
    }
  }
}

async function processCompletedVideo(
  supabase: any,
  videoId: string,
  result: AIGenerationResponse
): Promise<void> {
  try {
    // Download and upload video to our storage
    const videoUrl = await uploadVideoToStorage(supabase, videoId, result.videoUrl!)
    const thumbnailUrl = await uploadThumbnailToStorage(supabase, videoId, result.thumbnailUrl!)
    
    // Update video record with final data
    const { error } = await supabase
      .from('videos')
      .update({
        status: 'completed',
        stage: 'completed',
        progress: 100,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration: result.duration,
        completed_at: new Date().toISOString(),
        generation_time: await calculateGenerationTime(supabase, videoId),
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)
    
    if (error) {
      throw error
    }
    
    // Update usage statistics
    const { data: video } = await supabase
      .from('videos')
      .select('user_id')
      .eq('id', videoId)
      .single()
    
    if (video) {
      await supabase.rpc('update_usage_stats', { p_user_id: video.user_id })
    }
    
    // Clean up generation queue
    await supabase
      .from('video_generations')
      .delete()
      .eq('video_id', videoId)
    
    console.log(`Video ${videoId} completed successfully`)
    
  } catch (error) {
    console.error('Error processing completed video:', error)
    throw error
  }
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

async function enhancePrompt(originalPrompt: string, settings: any): Promise<string> {
  try {
    // Simple prompt enhancement - could be made more sophisticated
    let enhanced = originalPrompt
    
    // Add style specifications
    if (settings.style) {
      enhanced += `, ${settings.style} style`
    }
    
    // Add resolution/quality hints
    if (settings.resolution === '4k') {
      enhanced += ', ultra high definition, crisp details'
    } else if (settings.resolution === '1080p') {
      enhanced += ', high definition, clear details'
    }
    
    // Add duration context
    if (settings.duration) {
      if (settings.duration <= 5) {
        enhanced += ', short clip'
      } else if (settings.duration <= 15) {
        enhanced += ', medium length sequence'
      } else {
        enhanced += ', extended scene'
      }
    }
    
    // Add technical improvements
    enhanced += ', professional cinematography, smooth motion'
    
    return enhanced
    
  } catch (error) {
    console.error('Prompt enhancement error:', error)
    return originalPrompt
  }
}

async function uploadVideoToStorage(
  supabase: any,
  videoId: string,
  sourceUrl: string
): Promise<string> {
  try {
    // Download video from AI service
    const videoResponse = await fetch(sourceUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`)
    }
    
    const videoBlob = await videoResponse.blob()
    const videoBuffer = await videoBlob.arrayBuffer()
    
    // Generate storage path
    const { data: video } = await supabase
      .from('videos')
      .select('user_id')
      .eq('id', videoId)
      .single()
    
    const storagePath = `${new Date().getFullYear()}/${video.user_id}/${videoId}.mp4`
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(storagePath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true
      })
    
    if (error) {
      throw error
    }
    
    // Return public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(storagePath)
    
    return publicUrl
    
  } catch (error) {
    console.error('Video upload error:', error)
    // Return original URL if upload fails
    return sourceUrl
  }
}

async function uploadThumbnailToStorage(
  supabase: any,
  videoId: string,
  sourceUrl: string
): Promise<string> {
  try {
    const thumbnailResponse = await fetch(sourceUrl)
    if (!thumbnailResponse.ok) {
      throw new Error(`Failed to download thumbnail: ${thumbnailResponse.statusText}`)
    }
    
    const thumbnailBlob = await thumbnailResponse.blob()
    const thumbnailBuffer = await thumbnailBlob.arrayBuffer()
    
    const { data: video } = await supabase
      .from('videos')
      .select('user_id')
      .eq('id', videoId)
      .single()
    
    const thumbnailId = crypto.randomUUID()
    const storagePath = `${new Date().getFullYear()}/${video.user_id}/${videoId}/${thumbnailId}.jpg`
    
    const { error } = await supabase.storage
      .from('thumbnails')
      .upload(storagePath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (error) {
      throw error
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(storagePath)
    
    // Create thumbnail record
    await supabase
      .from('thumbnails')
      .insert({
        id: thumbnailId,
        video_id: videoId,
        url: publicUrl,
        timestamp_seconds: 0,
        width: 1920,
        height: 1080,
        format: 'jpg',
        file_size: thumbnailBuffer.byteLength,
        is_default: true
      })
    
    return publicUrl
    
  } catch (error) {
    console.error('Thumbnail upload error:', error)
    return sourceUrl
  }
}

async function updateVideoStatus(
  supabase: any,
  videoId: string,
  status: Partial<GenerationStatus>
): Promise<void> {
  await supabase.rpc('update_video_status', {
    p_video_id: videoId,
    p_status: status.status,
    p_stage: status.stage,
    p_progress: status.progress,
    p_estimated_time: status.estimatedTimeRemaining,
    p_error: status.error
  })
}

async function calculateGenerationTime(supabase: any, videoId: string): Promise<number> {
  const { data: video } = await supabase
    .from('videos')
    .select('created_at, started_at')
    .eq('id', videoId)
    .single()
  
  if (video && video.started_at) {
    const startTime = new Date(video.started_at).getTime()
    const endTime = Date.now()
    return Math.floor((endTime - startTime) / 1000) // seconds
  }
  
  return 0
}

// =====================================================================================
// QUEUE MANAGEMENT
// =====================================================================================

async function getNextGenerationJob(supabase: any): Promise<VideoGenerationRequest | null> {
  try {
    // Use database function to assign job to this worker
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { data: assignedJobs } = await supabase.rpc(
      'assign_generation_to_worker',
      {
        worker_name: workerId,
        max_assignments: 1
      }
    )
    
    if (!assignedJobs || assignedJobs.length === 0) {
      return null
    }
    
    const jobId = assignedJobs[0]
    
    // Get full job details
    const { data: job } = await supabase
      .from('video_generations')
      .select(`
        id,
        video_id,
        user_id,
        priority,
        videos (
          id,
          prompt,
          settings
        )
      `)
      .eq('id', jobId)
      .single()
    
    if (!job || !job.videos) {
      return null
    }
    
    return {
      videoId: job.videos.id,
      userId: job.user_id,
      prompt: job.videos.prompt,
      settings: job.videos.settings || {},
      priority: job.priority
    }
    
  } catch (error) {
    console.error('Error getting next job:', error)
    return null
  }
}

// =====================================================================================
// MAIN PROCESSING FUNCTION
// =====================================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'process'
    
    switch (action) {
      case 'process': {
        // Process next job in queue
        const job = await getNextGenerationJob(supabase)
        
        if (!job) {
          return new Response(
            JSON.stringify({ message: 'No jobs in queue' }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        // Start generation
        const result = await startVideoGeneration(supabase, job)
        
        return new Response(
          JSON.stringify({ 
            success: true,
            videoId: job.videoId,
            status: result
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      case 'check': {
        // Check status of specific video
        const videoId = url.searchParams.get('videoId')
        
        if (!videoId) {
          throw new Error('Video ID required for status check')
        }
        
        const { data: video } = await supabase
          .from('videos')
          .select('veo_job_id, status')
          .eq('id', videoId)
          .single()
        
        if (!video) {
          throw new Error('Video not found')
        }
        
        if (video.veo_job_id && video.status === 'processing') {
          const result = await checkGenerationProgress(supabase, videoId, video.veo_job_id)
          
          return new Response(
            JSON.stringify({ 
              success: true,
              videoId: videoId,
              status: result
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            videoId: videoId,
            status: { status: video.status }
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }
    
  } catch (error) {
    console.error('Video processing error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})