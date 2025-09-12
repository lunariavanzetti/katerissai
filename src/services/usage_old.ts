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
        type: data.type,
        count: data.count,
        timestamp: new Date().toISOString(),
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

      // Update current usage data
      await this.updateCurrentUsage(data.userId);

      return this.mapDatabaseToUsageEvent(usageEvent);
    } catch (error) {
      console.error('Failed to record usage:', error);
      throw error;
    }
  }

  /**
   * Get current usage data for a user
   */
  async getCurrentUsage(userId: string): Promise<UsageData> {
    try {
      // Get user's current subscription
      const subscription = await subscriptionService.getSubscriptionByUserId(userId);
      
      // Determine current period based on subscription or monthly cycle
      const { currentPeriodStart, currentPeriodEnd } = this.getCurrentPeriod(subscription);
      
      // Get plan limits
      const limits = await subscriptionService.getSubscriptionLimits(userId);
      
      // Count videos generated in current period
      const { data: usageEvents, error } = await supabase
        .from('usage_events')
        .select('count')
        .eq('user_id', userId)
        .eq('type', 'video_generated')
        .gte('timestamp', currentPeriodStart.toISOString())
        .lte('timestamp', currentPeriodEnd.toISOString());

      if (error) {
        throw new Error(`Failed to get usage data: ${error.message}`);
      }

      const videosGenerated = usageEvents.reduce((total, event) => total + event.count, 0);
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
        .select('timestamp')
        .eq('user_id', userId)
        .eq('type', 'video_generated')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        userId,
        subscriptionId: subscription?.id,
        currentPeriodStart,
        currentPeriodEnd,
        videosGenerated,
        videoLimit,
        remainingVideos,
        usagePercentage,
        resetDate: currentPeriodEnd,
        overageCount,
        overageCharges,
        lastVideoAt: lastVideoEvent ? new Date(lastVideoEvent.timestamp) : undefined
      };
    } catch (error) {
      console.error('Failed to get current usage:', error);
      throw error;
    }
  }

  /**
   * Check if user can generate more videos
   */
  async canGenerateVideo(userId: string): Promise<{
    canGenerate: boolean;
    reason?: string;
    videosRemaining?: number;
    requiresUpgrade?: boolean;
  }> {
    try {
      const usage = await this.getCurrentUsage(userId);
      
      // Premium users have unlimited videos
      if (usage.videoLimit === null) {
        return { canGenerate: true };
      }

      // Check if user has remaining videos in their limit
      if (usage.remainingVideos !== null && usage.remainingVideos > 0) {
        return { 
          canGenerate: true, 
          videosRemaining: usage.remainingVideos 
        };
      }

      // Check if user has reached their limit
      if (usage.videosGenerated >= usage.videoLimit) {
        return {
          canGenerate: false,
          reason: `You've reached your monthly limit of ${usage.videoLimit} videos`,
          requiresUpgrade: true
        };
      }

      return { canGenerate: true };
    } catch (error) {
      console.error('Failed to check video generation limit:', error);
      return { 
        canGenerate: false, 
        reason: 'Unable to verify usage limits' 
      };
    }
  }

  /**
   * Get usage history for a user
   */
  async getUsageHistory(
    userId: string, 
    startDate?: Date, 
    endDate?: Date, 
    limit: number = 100
  ): Promise<UsageEvent[]> {
    try {
      let query = supabase
        .from('usage_events')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data: usageEvents, error } = await query;

      if (error) {
        throw new Error(`Failed to get usage history: ${error.message}`);
      }

      return usageEvents.map(this.mapDatabaseToUsageEvent);
    } catch (error) {
      console.error('Failed to get usage history:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics by period
   */
  async getUsageStatistics(
    userId: string,
    periodType: 'daily' | 'weekly' | 'monthly' = 'monthly',
    periods: number = 12
  ): Promise<UsagePeriod[]> {
    try {
      const subscription = await subscriptionService.getSubscriptionByUserId(userId);
      const limits = await subscriptionService.getSubscriptionLimits(userId);
      
      const periodsData: UsagePeriod[] = [];
      
      for (let i = 0; i < periods; i++) {
        const { start, end } = this.getPeriodDates(periodType, i);
        
        const { data: usageEvents, error } = await supabase
          .from('usage_events')
          .select('count')
          .eq('user_id', userId)
          .eq('type', 'video_generated')
          .gte('timestamp', start.toISOString())
          .lte('timestamp', end.toISOString());

        if (error) {
          throw new Error(`Failed to get usage statistics: ${error.message}`);
        }

        const videosGenerated = usageEvents.reduce((total, event) => total + event.count, 0);
        const overageCount = limits.videoLimit ? Math.max(0, videosGenerated - limits.videoLimit) : 0;

        periodsData.push({
          start,
          end,
          videosGenerated,
          videoLimit: limits.videoLimit,
          overageCount
        });
      }

      return periodsData.reverse(); // Most recent first
    } catch (error) {
      console.error('Failed to get usage statistics:', error);
      throw error;
    }
  }

  /**
   * Reset usage for a new period
   */
  async resetUsage(userId: string, reason: string = 'Period reset'): Promise<void> {
    try {
      await this.recordUsage({
        userId,
        type: 'subscription_reset',
        count: 0,
        metadata: { reason }
      });
    } catch (error) {
      console.error('Failed to reset usage:', error);
      throw error;
    }
  }

  /**
   * Get top usage periods
   */
  async getTopUsagePeriods(
    userId: string,
    limit: number = 5
  ): Promise<{
    period: string;
    videosGenerated: number;
    overageCount: number;
  }[]> {
    try {
      const statistics = await this.getUsageStatistics(userId, 'monthly', 12);
      
      return statistics
        .map(stat => ({
          period: `${stat.start.getFullYear()}-${(stat.start.getMonth() + 1).toString().padStart(2, '0')}`,
          videosGenerated: stat.videosGenerated,
          overageCount: stat.overageCount
        }))
        .sort((a, b) => b.videosGenerated - a.videosGenerated)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get top usage periods:', error);
      throw error;
    }
  }

  /**
   * Calculate usage trends
   */
  async getUsageTrends(userId: string): Promise<{
    currentMonthUsage: number;
    previousMonthUsage: number;
    changePercentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    averageDaily: number;
  }> {
    try {
      const statistics = await this.getUsageStatistics(userId, 'monthly', 2);
      
      if (statistics.length < 2) {
        return {
          currentMonthUsage: statistics[0]?.videosGenerated || 0,
          previousMonthUsage: 0,
          changePercentage: 0,
          trend: 'stable',
          averageDaily: 0
        };
      }

      const currentMonthUsage = statistics[0].videosGenerated;
      const previousMonthUsage = statistics[1].videosGenerated;
      
      const changePercentage = previousMonthUsage > 0 
        ? ((currentMonthUsage - previousMonthUsage) / previousMonthUsage) * 100 
        : 0;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (changePercentage > 5) trend = 'increasing';
      else if (changePercentage < -5) trend = 'decreasing';

      // Calculate average daily usage for current month
      const daysInMonth = new Date().getDate();
      const averageDaily = currentMonthUsage / daysInMonth;

      return {
        currentMonthUsage,
        previousMonthUsage,
        changePercentage: Math.round(changePercentage * 100) / 100,
        trend,
        averageDaily: Math.round(averageDaily * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get usage trends:', error);
      throw error;
    }
  }

  /**
   * Update current usage cache
   */
  private async updateCurrentUsage(userId: string): Promise<void> {
    try {
      const usage = await this.getCurrentUsage(userId);
      
      // Update or insert current usage record
      const { error } = await supabase
        .from('current_usage')
        .upsert({
          user_id: userId,
          videos_generated: usage.videosGenerated,
          video_limit: usage.videoLimit,
          remaining_videos: usage.remainingVideos,
          usage_percentage: usage.usagePercentage,
          overage_count: usage.overageCount,
          overage_charges: usage.overageCharges,
          current_period_start: usage.currentPeriodStart.toISOString(),
          current_period_end: usage.currentPeriodEnd.toISOString(),
          last_updated: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to update usage cache:', error.message);
      }
    } catch (error) {
      console.warn('Failed to update usage cache:', error);
    }
  }

  /**
   * Get current period dates based on subscription or default monthly cycle
   */
  private getCurrentPeriod(subscription: any): { currentPeriodStart: Date; currentPeriodEnd: Date } {
    if (subscription && subscription.currentPeriodStart && subscription.currentPeriodEnd) {
      return {
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd
      };
    }

    // Default to calendar month
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return { currentPeriodStart, currentPeriodEnd };
  }

  /**
   * Calculate overage charges based on plan
   */
  private calculateOverageCharges(plan: PricingTier, overageCount: number): number {
    if (plan !== 'basic' || overageCount <= 0) {
      return 0;
    }

    // Basic plan overage rate: $2.49 per additional video
    return overageCount * 2.49;
  }

  /**
   * Get period dates for statistics
   */
  private getPeriodDates(periodType: 'daily' | 'weekly' | 'monthly', periodsAgo: number): { start: Date; end: Date } {
    const now = new Date();
    
    switch (periodType) {
      case 'daily':
        const dailyStart = new Date(now);
        dailyStart.setDate(dailyStart.getDate() - periodsAgo);
        dailyStart.setHours(0, 0, 0, 0);
        
        const dailyEnd = new Date(dailyStart);
        dailyEnd.setHours(23, 59, 59, 999);
        
        return { start: dailyStart, end: dailyEnd };
        
      case 'weekly':
        const weeklyStart = new Date(now);
        weeklyStart.setDate(weeklyStart.getDate() - (periodsAgo * 7));
        weeklyStart.setHours(0, 0, 0, 0);
        
        const weeklyEnd = new Date(weeklyStart);
        weeklyEnd.setDate(weeklyEnd.getDate() + 6);
        weeklyEnd.setHours(23, 59, 59, 999);
        
        return { start: weeklyStart, end: weeklyEnd };
        
      case 'monthly':
        const monthlyStart = new Date(now.getFullYear(), now.getMonth() - periodsAgo, 1);
        const monthlyEnd = new Date(now.getFullYear(), now.getMonth() - periodsAgo + 1, 0, 23, 59, 59, 999);
        
        return { start: monthlyStart, end: monthlyEnd };
        
      default:
        throw new Error(`Unsupported period type: ${periodType}`);
    }
  }

  /**
   * Map database record to UsageEvent type
   */
  private mapDatabaseToUsageEvent(dbUsageEvent: any): UsageEvent {
    return {
      id: dbUsageEvent.id,
      userId: dbUsageEvent.user_id,
      type: dbUsageEvent.type,
      count: dbUsageEvent.count,
      timestamp: new Date(dbUsageEvent.timestamp),
      metadata: dbUsageEvent.metadata || {}
    };
  }
}

// Export singleton instance
export const usageService = new UsageService();
export default usageService;