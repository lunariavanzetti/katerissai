// Usage Tracking Service for Kateriss AI Video Generator
// Video generation tracking and limit enforcement

import { 
  UsageData,
  UsageEvent,
  UsageEventType,
  PricingTier
} from '../types/payment';
import { subscriptionService } from './subscription';
import { supabase } from '../config/supabase';

export interface UsageRecordData {
  userId: string;
  type: UsageEventType;
  count: number;
  metadata?: Record<string, any>;
}

export interface UsagePeriod {
  start: Date;
  end: Date;
  videosGenerated: number;
  videoLimit: number | null;
  overageCount: number;
}

class UsageService {
  /**
   * Record a usage event
   */
  async recordUsage(data: UsageRecordData): Promise<UsageEvent> {
    try {
      const usageEventData = {
        user_id: data.userId,
        event_type: data.type,
        credits_used: data.count,
        created_at: new Date().toISOString(),
        metadata: data.metadata || {}
      };

      const { data: usageEvent, error } = await supabase
        .from('usage_events')
        .insert([usageEventData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to record usage: ${error.message}`);
      }

      return {
        id: usageEvent.id,
        userId: usageEvent.user_id,
        type: usageEvent.event_type as UsageEventType,
        count: usageEvent.credits_used,
        timestamp: usageEvent.created_at,
        metadata: usageEvent.metadata || {}
      };
    } catch (error: any) {
      console.error('Failed to record usage:', error);
      throw error;
    }
  }

  /**
   * Get current usage data for a user
   */
  async getCurrentUsage(userId: string): Promise<UsageData> {
    try {
      const subscription = await subscriptionService.getSubscriptionByUserId(userId);
      const limits = this.getUsageLimits(subscription?.plan || 'pay-per-video');
      
      // Calculate current billing period
      const now = new Date();
      const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      // Count videos generated in current period
      const { data: usageEvents, error } = await supabase
        .from('usage_events')
        .select('credits_used')
        .eq('user_id', userId)
        .eq('event_type', 'video_generated')
        .gte('created_at', currentPeriodStart.toISOString())
        .lte('created_at', currentPeriodEnd.toISOString());

      if (error) {
        throw new Error(`Failed to get usage data: ${error.message}`);
      }

      const videosGenerated = usageEvents.reduce((total, event) => total + event.credits_used, 0);
      const videoLimit = limits.videoLimit;
      const remainingVideos = videoLimit ? Math.max(0, videoLimit - videosGenerated) : null;
      const usagePercentage = videoLimit ? Math.min(100, (videosGenerated / videoLimit) * 100) : 0;
      const overageCount = videoLimit ? Math.max(0, videosGenerated - videoLimit) : 0;
      
      // Calculate overage charges for basic plan
      const overageCharges = this.calculateOverageCharges(
        subscription?.plan || 'pay-per-video',
        overageCount
      );

      // Get last video generation timestamp
      const { data: lastVideoEvent } = await supabase
        .from('usage_events')
        .select('created_at')
        .eq('user_id', userId)
        .eq('event_type', 'video_generated')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastVideoTimestamp = lastVideoEvent?.[0]?.created_at
        ? new Date(lastVideoEvent[0].created_at).toISOString()
        : null;

      return {
        userId,
        period: {
          start: currentPeriodStart,
          end: currentPeriodEnd,
          videosGenerated,
          videoLimit,
          overageCount,
        },
        limits,
        usage: {
          videosGenerated,
          videoLimit,
          remainingVideos,
          usagePercentage: Math.round(usagePercentage),
          overageCount,
          overageCharges,
          resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          lastVideoGenerated: lastVideoTimestamp,
        },
        subscription: subscription ? {
          tier: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        } : null,
      };
    } catch (error: any) {
      console.error('Failed to get current usage:', error);
      throw error;
    }
  }

  /**
   * Get usage history for a period
   */
  async getUsageHistory(
    userId: string,
    startDate: Date,
    endDate: Date,
    eventType?: UsageEventType
  ): Promise<UsageEvent[]> {
    try {
      let query = supabase
        .from('usage_events')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data: events, error } = await query;

      if (error) {
        throw new Error(`Failed to get usage history: ${error.message}`);
      }

      return events.map(event => ({
        id: event.id,
        userId: event.user_id,
        type: event.event_type as UsageEventType,
        count: event.credits_used,
        timestamp: event.created_at,
        metadata: event.metadata || {},
        videoId: event.video_id,
      }));
    } catch (error: any) {
      console.error('Failed to get usage history:', error);
      throw error;
    }
  }

  /**
   * Check if user can generate videos based on limits
   */
  async canGenerateVideo(userId: string): Promise<boolean> {
    try {
      const usage = await this.getCurrentUsage(userId);
      
      // Pay-per-video users can always generate (they pay per video)
      if (usage.subscription?.tier === 'pay-per-video') {
        return true;
      }
      
      // Other tiers check against their limits
      return usage.usage.remainingVideos === null || usage.usage.remainingVideos > 0;
    } catch (error) {
      console.error('Failed to check video generation capability:', error);
      return false;
    }
  }

  /**
   * Get usage limits for a subscription tier
   */
  private getUsageLimits(tier: PricingTier) {
    const limits = {
      'pay-per-video': {
        videoLimit: null, // No limit, pay per video
        storageLimit: 1, // GB
        apiCallsLimit: null,
        supportLevel: 'community',
      },
      'basic': {
        videoLimit: 50,
        storageLimit: 10, // GB  
        apiCallsLimit: 1000,
        supportLevel: 'email',
      },
      'premium': {
        videoLimit: null, // Unlimited
        storageLimit: 100, // GB
        apiCallsLimit: null,
        supportLevel: 'priority',
      },
    };

    return limits[tier] || limits['pay-per-video'];
  }

  /**
   * Calculate overage charges for basic plan
   */
  private calculateOverageCharges(tier: PricingTier, overageCount: number): number {
    if (tier !== 'basic' || overageCount <= 0) {
      return 0;
    }

    // Basic plan: $0.50 per video over limit
    return overageCount * 0.5;
  }

  /**
   * Record video generation usage
   */
  async recordVideoGeneration(userId: string, videoId: string, creditsUsed: number = 1): Promise<void> {
    await this.recordUsage({
      userId,
      type: 'video_generated',
      count: creditsUsed,
      metadata: { videoId }
    });
  }

  /**
   * Get monthly usage summary
   */
  async getMonthlyUsage(userId: string, year: number, month: number): Promise<UsagePeriod> {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);
    
    const { data: events, error } = await supabase
      .from('usage_events')
      .select('credits_used')
      .eq('user_id', userId)
      .eq('event_type', 'video_generated')
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (error) {
      throw new Error(`Failed to get monthly usage: ${error.message}`);
    }

    const videosGenerated = events.reduce((total, event) => total + event.credits_used, 0);
    const subscription = await subscriptionService.getSubscriptionByUserId(userId);
    const limits = this.getUsageLimits(subscription?.plan || 'pay-per-video');
    const videoLimit = limits.videoLimit;
    const overageCount = videoLimit ? Math.max(0, videosGenerated - videoLimit) : 0;

    return {
      start: periodStart,
      end: periodEnd,
      videosGenerated,
      videoLimit,
      overageCount,
    };
  }
}

export const usageService = new UsageService();