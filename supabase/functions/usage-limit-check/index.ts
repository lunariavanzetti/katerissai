// =====================================================================================
// Kateriss AI Video Generator - Usage Limit Validation Function
// Created: 2025-09-09
// Description: Comprehensive usage limit checking, subscription validation,
//              rate limiting, and capacity management for video generation
// =====================================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

interface UsageLimitCheck {
  userId: string
  requestType: 'video_generation' | 'api_call' | 'download' | 'view'
  requestDetails?: {
    duration?: number
    resolution?: string
    concurrent?: boolean
  }
}

interface UsageLimitResult {
  allowed: boolean
  reason?: string
  limits: {
    videosPerMonth: number | null
    videosUsed: number
    videosRemaining: number | null
    concurrentLimit: number
    currentConcurrent: number
    rateLimitRpm: number
    rateUsedThisMinute: number
  }
  subscription: {
    tier: string
    status: string
    resetDate: string
    expiresAt?: string
  }
  suggestions?: string[]
  retryAfter?: number // seconds
}

interface RateLimitWindow {
  userId: string
  requestType: string
  count: number
  windowStart: Date
  windowEnd: Date
}

// =====================================================================================
// CONFIGURATION
// =====================================================================================

const TIER_LIMITS = {
  'pay-per-video': {
    videosPerMonth: null, // Must purchase each video
    concurrentGenerations: 1,
    rateLimitRpm: 10, // API calls per minute
    maxDuration: 30, // seconds
    maxResolution: '1080p',
    downloadLimit: 5 // downloads per day
  },
  'basic': {
    videosPerMonth: 20,
    concurrentGenerations: 2,
    rateLimitRpm: 30,
    maxDuration: 60,
    maxResolution: '1080p',
    downloadLimit: 50
  },
  'premium': {
    videosPerMonth: null, // unlimited
    concurrentGenerations: 5,
    rateLimitRpm: 100,
    maxDuration: 300,
    maxResolution: '4k',
    downloadLimit: null // unlimited
  }
}

const GRACE_PERIOD_DAYS = 7 // Days after plan expires before hard limits

// =====================================================================================
// USAGE VALIDATION FUNCTIONS
// =====================================================================================

async function checkMonthlyVideoLimit(
  supabase: any,
  userId: string,
  tier: string
): Promise<{
  allowed: boolean
  used: number
  limit: number | null
  remaining: number | null
  resetDate: string
}> {
  try {
    // Get current period usage
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const { data: usage } = await supabase
      .from('usage')
      .select('videos_generated, videos_limit, reset_date')
      .eq('user_id', userId)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())
      .single()
    
    const tierLimits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS]
    const monthlyLimit = tierLimits?.videosPerMonth || null
    const videosUsed = usage?.videos_generated || 0
    
    // For pay-per-video, check if they have available credits
    if (tier === 'pay-per-video') {
      const hasCredits = await checkAvailableCredits(supabase, userId)
      return {
        allowed: hasCredits,
        used: videosUsed,
        limit: null,
        remaining: hasCredits ? 1 : 0,
        resetDate: 'N/A - Pay per video'
      }
    }
    
    // For subscription tiers
    const remaining = monthlyLimit ? monthlyLimit - videosUsed : null
    const allowed = monthlyLimit ? videosUsed < monthlyLimit : true
    
    return {
      allowed: allowed,
      used: videosUsed,
      limit: monthlyLimit,
      remaining: remaining,
      resetDate: usage?.reset_date || periodEnd.toISOString()
    }
    
  } catch (error) {
    console.error('Error checking monthly limit:', error)
    return {
      allowed: false,
      used: 0,
      limit: 0,
      remaining: 0,
      resetDate: 'Error'
    }
  }
}

async function checkConcurrentGenerations(
  supabase: any,
  userId: string,
  tier: string
): Promise<{
  allowed: boolean
  current: number
  limit: number
}> {
  try {
    const { count } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['pending', 'processing'])
    
    const tierLimits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS]
    const concurrentLimit = tierLimits?.concurrentGenerations || 1
    const currentConcurrent = count || 0
    
    return {
      allowed: currentConcurrent < concurrentLimit,
      current: currentConcurrent,
      limit: concurrentLimit
    }
    
  } catch (error) {
    console.error('Error checking concurrent generations:', error)
    return {
      allowed: false,
      current: 0,
      limit: 1
    }
  }
}

async function checkRateLimit(
  supabase: any,
  userId: string,
  tier: string,
  requestType: string
): Promise<{
  allowed: boolean
  used: number
  limit: number
  resetTime: Date
}> {
  try {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 60000) // 1 minute window
    
    // Count requests in the last minute
    const { count } = await supabase
      .from('rate_limit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('request_type', requestType)
      .gte('created_at', windowStart.toISOString())
    
    const tierLimits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS]
    const rateLimit = tierLimits?.rateLimitRpm || 10
    const currentUsage = count || 0
    
    // Log this request
    await supabase
      .from('rate_limit_log')
      .insert({
        user_id: userId,
        request_type: requestType,
        created_at: now.toISOString()
      })
    
    // Clean up old rate limit logs (older than 1 hour)
    const cleanupTime = new Date(now.getTime() - 3600000)
    await supabase
      .from('rate_limit_log')
      .delete()
      .lt('created_at', cleanupTime.toISOString())
    
    const resetTime = new Date(windowStart.getTime() + 60000)
    
    return {
      allowed: currentUsage < rateLimit,
      used: currentUsage,
      limit: rateLimit,
      resetTime: resetTime
    }
    
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return {
      allowed: false,
      used: 0,
      limit: 10,
      resetTime: new Date()
    }
  }
}

async function checkSubscriptionStatus(
  supabase: any,
  userId: string
): Promise<{
  isActive: boolean
  tier: string
  status: string
  expiresAt?: string
  gracePeriod: boolean
}> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()
    
    if (!profile) {
      return {
        isActive: false,
        tier: 'pay-per-video',
        status: 'inactive',
        gracePeriod: false
      }
    }
    
    // For pay-per-video, always active (no subscription required)
    if (profile.subscription_tier === 'pay-per-video') {
      return {
        isActive: true,
        tier: 'pay-per-video',
        status: 'active',
        gracePeriod: false
      }
    }
    
    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, current_period_end, canceled_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (!subscription) {
      return {
        isActive: false,
        tier: profile.subscription_tier,
        status: 'inactive',
        gracePeriod: false
      }
    }
    
    const now = new Date()
    const expiresAt = new Date(subscription.current_period_end)
    const gracePeriodEnd = new Date(expiresAt.getTime() + (GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000))
    
    const isActive = subscription.status === 'active' && expiresAt > now
    const gracePeriod = !isActive && now < gracePeriodEnd
    
    return {
      isActive: isActive || gracePeriod,
      tier: profile.subscription_tier,
      status: subscription.status,
      expiresAt: expiresAt.toISOString(),
      gracePeriod: gracePeriod
    }
    
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return {
      isActive: false,
      tier: 'pay-per-video',
      status: 'error',
      gracePeriod: false
    }
  }
}

async function checkAvailableCredits(
  supabase: any,
  userId: string
): Promise<boolean> {
  try {
    // For pay-per-video users, check if they have recent successful payments
    // or available credits in their account
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('video_count, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .eq('type', 'one-time')
      .is('video_count', null) // Unused credits
      .order('created_at', { ascending: false })
      .limit(1)
    
    // Check if they have unused video credits
    if (recentPayments && recentPayments.length > 0) {
      const payment = recentPayments[0]
      const paymentDate = new Date(payment.created_at)
      const now = new Date()
      const daysSincePayment = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
      
      // Credits valid for 30 days
      return daysSincePayment < 30
    }
    
    return false
    
  } catch (error) {
    console.error('Error checking credits:', error)
    return false
  }
}

async function checkContentLimits(
  request: UsageLimitCheck,
  tier: string
): Promise<{
  allowed: boolean
  violations: string[]
}> {
  const violations: string[] = []
  const tierLimits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS]
  
  if (!tierLimits) {
    return { allowed: false, violations: ['Invalid tier'] }
  }
  
  const { requestDetails } = request
  
  // Check duration limits
  if (requestDetails?.duration && requestDetails.duration > tierLimits.maxDuration) {
    violations.push(
      `Video duration ${requestDetails.duration}s exceeds ${tierLimits.maxDuration}s limit for ${tier} tier`
    )
  }
  
  // Check resolution limits
  if (requestDetails?.resolution) {
    const resolutionHierarchy = ['480p', '720p', '1080p', '4k']
    const requestedIndex = resolutionHierarchy.indexOf(requestDetails.resolution)
    const maxIndex = resolutionHierarchy.indexOf(tierLimits.maxResolution)
    
    if (requestedIndex > maxIndex) {
      violations.push(
        `Resolution ${requestDetails.resolution} not available for ${tier} tier (max: ${tierLimits.maxResolution})`
      )
    }
  }
  
  return {
    allowed: violations.length === 0,
    violations: violations
  }
}

// =====================================================================================
// SUGGESTION GENERATION
// =====================================================================================

function generateSuggestions(
  result: UsageLimitResult,
  violations: string[]
): string[] {
  const suggestions: string[] = []
  
  // Monthly limit suggestions
  if (result.limits.videosPerMonth && result.limits.videosUsed >= result.limits.videosPerMonth) {
    suggestions.push('💎 Upgrade to Premium for unlimited videos')
    suggestions.push(`⏰ Your limit resets on ${new Date(result.subscription.resetDate).toLocaleDateString()}`)
  }
  
  // Concurrent limit suggestions
  if (result.limits.currentConcurrent >= result.limits.concurrentLimit) {
    suggestions.push('⏳ Wait for current videos to complete before starting new ones')
    if (result.subscription.tier !== 'premium') {
      suggestions.push('⚡ Premium users get 5 concurrent generations')
    }
  }
  
  // Rate limit suggestions
  if (result.limits.rateUsedThisMinute >= result.limits.rateLimitRpm) {
    suggestions.push('🐌 You\'re making requests too quickly, please slow down')
    suggestions.push('📈 Higher tiers have increased rate limits')
  }
  
  // Content limit suggestions
  if (violations.length > 0) {
    if (violations.some(v => v.includes('duration'))) {
      suggestions.push('✂️ Try reducing video duration for your current tier')
      suggestions.push('📺 Premium users can create videos up to 5 minutes long')
    }
    
    if (violations.some(v => v.includes('resolution'))) {
      suggestions.push('📱 Try a lower resolution for your current tier')
      suggestions.push('🎥 4K resolution is available for Premium users')
    }
  }
  
  // Tier-specific suggestions
  if (result.subscription.tier === 'pay-per-video') {
    suggestions.push('📦 Consider Basic plan for 20 videos/month at better value')
  } else if (result.subscription.tier === 'basic') {
    suggestions.push('🚀 Premium offers unlimited videos and advanced features')
  }
  
  return suggestions
}

// =====================================================================================
// MAIN VALIDATION FUNCTION
// =====================================================================================

async function validateUsageLimit(
  supabase: any,
  request: UsageLimitCheck
): Promise<UsageLimitResult> {
  try {
    // Check subscription status first
    const subscriptionCheck = await checkSubscriptionStatus(supabase, request.userId)
    
    if (!subscriptionCheck.isActive) {
      return {
        allowed: false,
        reason: subscriptionCheck.gracePeriod 
          ? 'Subscription expired - in grace period'
          : 'No active subscription',
        limits: {
          videosPerMonth: 0,
          videosUsed: 0,
          videosRemaining: 0,
          concurrentLimit: 0,
          currentConcurrent: 0,
          rateLimitRpm: 0,
          rateUsedThisMinute: 0
        },
        subscription: {
          tier: subscriptionCheck.tier,
          status: subscriptionCheck.status,
          resetDate: subscriptionCheck.expiresAt || 'N/A',
          expiresAt: subscriptionCheck.expiresAt
        },
        suggestions: ['🔄 Please renew your subscription to continue']
      }
    }
    
    // Run all limit checks concurrently
    const [monthlyCheck, concurrentCheck, rateCheck, contentCheck] = await Promise.all([
      checkMonthlyVideoLimit(supabase, request.userId, subscriptionCheck.tier),
      checkConcurrentGenerations(supabase, request.userId, subscriptionCheck.tier),
      checkRateLimit(supabase, request.userId, subscriptionCheck.tier, request.requestType),
      checkContentLimits(request, subscriptionCheck.tier)
    ])
    
    // Determine overall allowance
    const allowed = monthlyCheck.allowed && 
                   concurrentCheck.allowed && 
                   rateCheck.allowed && 
                   contentCheck.allowed
    
    // Determine primary reason for rejection
    let reason: string | undefined
    if (!monthlyCheck.allowed) {
      reason = 'Monthly video limit exceeded'
    } else if (!concurrentCheck.allowed) {
      reason = 'Too many concurrent generations'
    } else if (!rateCheck.allowed) {
      reason = 'Rate limit exceeded'
    } else if (!contentCheck.allowed) {
      reason = contentCheck.violations[0]
    }
    
    const result: UsageLimitResult = {
      allowed: allowed,
      reason: reason,
      limits: {
        videosPerMonth: monthlyCheck.limit,
        videosUsed: monthlyCheck.used,
        videosRemaining: monthlyCheck.remaining,
        concurrentLimit: concurrentCheck.limit,
        currentConcurrent: concurrentCheck.current,
        rateLimitRpm: rateCheck.limit,
        rateUsedThisMinute: rateCheck.used
      },
      subscription: {
        tier: subscriptionCheck.tier,
        status: subscriptionCheck.status,
        resetDate: monthlyCheck.resetDate,
        expiresAt: subscriptionCheck.expiresAt
      }
    }
    
    // Add retry after for rate limits
    if (!rateCheck.allowed) {
      result.retryAfter = Math.ceil((rateCheck.resetTime.getTime() - Date.now()) / 1000)
    }
    
    // Generate suggestions
    result.suggestions = generateSuggestions(result, contentCheck.violations)
    
    // Log the usage check for analytics
    await supabase
      .from('usage_events')
      .insert({
        user_id: request.userId,
        type: allowed ? 'limit_check_passed' : 'limit_check_failed',
        metadata: {
          request_type: request.requestType,
          reason: reason,
          tier: subscriptionCheck.tier,
          limits: result.limits
        }
      })
    
    return result
    
  } catch (error) {
    console.error('Usage validation error:', error)
    
    return {
      allowed: false,
      reason: 'System error during validation',
      limits: {
        videosPerMonth: 0,
        videosUsed: 0,
        videosRemaining: 0,
        concurrentLimit: 0,
        currentConcurrent: 0,
        rateLimitRpm: 0,
        rateUsedThisMinute: 0
      },
      subscription: {
        tier: 'unknown',
        status: 'error',
        resetDate: 'N/A'
      },
      suggestions: ['❌ Please try again later or contact support']
    }
  }
}

// =====================================================================================
// BULK VALIDATION FOR ADMIN/MONITORING
// =====================================================================================

async function bulkValidateUsers(
  supabase: any,
  userIds: string[]
): Promise<Record<string, UsageLimitResult>> {
  const results: Record<string, UsageLimitResult> = {}
  
  // Process in batches to avoid overwhelming the database
  const batchSize = 10
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async userId => {
      const request: UsageLimitCheck = {
        userId: userId,
        requestType: 'video_generation'
      }
      
      const result = await validateUsageLimit(supabase, request)
      return { userId, result }
    })
    
    const batchResults = await Promise.all(batchPromises)
    
    for (const { userId, result } of batchResults) {
      results[userId] = result
    }
  }
  
  return results
}

// =====================================================================================
// MAIN EDGE FUNCTION
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
    const action = url.searchParams.get('action') || 'check'
    
    switch (action) {
      case 'check': {
        // Single user validation
        const body = await req.json()
        const request = body as UsageLimitCheck
        
        if (!request.userId || !request.requestType) {
          throw new Error('Missing required fields: userId, requestType')
        }
        
        const result = await validateUsageLimit(supabase, request)
        
        return new Response(
          JSON.stringify(result),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      case 'bulk': {
        // Bulk validation for monitoring
        const body = await req.json()
        const { userIds } = body
        
        if (!userIds || !Array.isArray(userIds)) {
          throw new Error('Invalid userIds array')
        }
        
        const results = await bulkValidateUsers(supabase, userIds)
        
        return new Response(
          JSON.stringify(results),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      case 'stats': {
        // Usage statistics for admin dashboard
        const { data: stats } = await supabase.rpc('get_system_analytics', {
          p_period_days: 7
        })
        
        return new Response(
          JSON.stringify(stats),
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
    console.error('Usage limit check error:', error)
    
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