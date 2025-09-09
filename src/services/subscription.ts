// Subscription Management Service for Kateriss AI Video Generator
// Comprehensive subscription lifecycle management with Paddle

import { 
  Subscription,
  SubscriptionStatus,
  SubscriptionChange,
  PricingTier,
  PricingPlan,
  DEFAULT_PRICING_PLANS
} from '../types/payment';
import { paddleService } from './paddle';
import { supabase } from '../config/supabase';

export interface SubscriptionCreateData {
  userId: string;
  paddleSubscriptionId: string;
  plan: PricingTier;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata?: Record<string, any>;
}

export interface SubscriptionUpdateData {
  status?: SubscriptionStatus;
  plan?: PricingTier;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  metadata?: Record<string, any>;
}

class SubscriptionService {
  /**
   * Create a new subscription
   */
  async createSubscription(data: SubscriptionCreateData): Promise<Subscription> {
    try {
      const subscriptionData = {
        user_id: data.userId,
        paddle_subscription_id: data.paddleSubscriptionId,
        plan: data.plan,
        status: data.status,
        current_period_start: data.currentPeriodStart.toISOString(),
        current_period_end: data.currentPeriodEnd.toISOString(),
        trial_start: data.trialStart?.toISOString(),
        trial_end: data.trialEnd?.toISOString(),
        cancel_at_period_end: false,
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .insert([subscriptionData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create subscription: ${error.message}`);
      }

      return this.mapDatabaseToSubscription(subscription);
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Row not found
          return null;
        }
        throw new Error(`Failed to get subscription: ${error.message}`);
      }

      return this.mapDatabaseToSubscription(subscription);
    } catch (error) {
      console.error('Failed to get subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription by user ID
   */
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to get user subscription: ${error.message}`);
      }

      if (!subscription) {
        return null;
      }

      return this.mapDatabaseToSubscription(subscription);
    } catch (error) {
      console.error('Failed to get user subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription by Paddle subscription ID
   */
  async getSubscriptionByPaddleId(paddleSubscriptionId: string): Promise<Subscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('paddle_subscription_id', paddleSubscriptionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Row not found
          return null;
        }
        throw new Error(`Failed to get subscription by Paddle ID: ${error.message}`);
      }

      return this.mapDatabaseToSubscription(subscription);
    } catch (error) {
      console.error('Failed to get subscription by Paddle ID:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId: string, updates: SubscriptionUpdateData): Promise<Subscription> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }

      if (updates.plan !== undefined) {
        updateData.plan = updates.plan;
      }

      if (updates.currentPeriodStart !== undefined) {
        updateData.current_period_start = updates.currentPeriodStart.toISOString();
      }

      if (updates.currentPeriodEnd !== undefined) {
        updateData.current_period_end = updates.currentPeriodEnd.toISOString();
      }

      if (updates.cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = updates.cancelAtPeriodEnd;
      }

      if (updates.canceledAt !== undefined) {
        updateData.canceled_at = updates.canceledAt.toISOString();
      }

      if (updates.metadata !== undefined) {
        updateData.metadata = updates.metadata;
      }

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      return this.mapDatabaseToSubscription(subscription);
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<Subscription> {
    try {
      // Get current subscription
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Cancel with Paddle
      const paddleResponse = await paddleService.cancelSubscription(subscription.paddleSubscriptionId);
      
      if (!paddleResponse.success) {
        throw new Error(`Paddle cancellation failed: ${paddleResponse.error?.message}`);
      }

      // Update local subscription
      const updates: SubscriptionUpdateData = {
        cancelAtPeriodEnd: !immediately,
        canceledAt: new Date()
      };

      if (immediately) {
        updates.status = 'canceled';
      }

      return await this.updateSubscription(subscriptionId, updates);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Note: Paddle doesn't have a direct reactivation API
      // This would typically require creating a new subscription
      // For now, we'll update the local status if the subscription is still valid

      if (subscription.status !== 'canceled' || !subscription.cancelAtPeriodEnd) {
        throw new Error('Subscription cannot be reactivated');
      }

      return await this.updateSubscription(subscriptionId, {
        cancelAtPeriodEnd: false,
        canceledAt: undefined,
        status: 'active'
      });
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      throw error;
    }
  }

  /**
   * Change subscription plan
   */
  async changeSubscriptionPlan(
    subscriptionId: string, 
    newPlan: PricingTier, 
    prorate: boolean = true
  ): Promise<{ subscription: Subscription; change: SubscriptionChange }> {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const newPlanData = DEFAULT_PRICING_PLANS.find(p => p.tier === newPlan);
      if (!newPlanData || !newPlanData.paddleProductId) {
        throw new Error('Invalid plan or missing Paddle product ID');
      }

      // Update plan with Paddle
      const paddleResponse = await paddleService.updateSubscriptionPlan(
        subscription.paddleSubscriptionId,
        newPlanData.paddleProductId,
        prorate
      );

      if (!paddleResponse.success) {
        throw new Error(`Paddle plan change failed: ${paddleResponse.error?.message}`);
      }

      // Create subscription change record
      const changeData = {
        subscription_id: subscriptionId,
        from_plan: subscription.plan,
        to_plan: newPlan,
        effective_date: new Date().toISOString(),
        proration_amount: 0, // This would come from Paddle response
        status: 'pending' as const,
        created_at: new Date().toISOString()
      };

      const { data: change, error: changeError } = await supabase
        .from('subscription_changes')
        .insert([changeData])
        .select()
        .single();

      if (changeError) {
        throw new Error(`Failed to record subscription change: ${changeError.message}`);
      }

      // Update subscription
      const updatedSubscription = await this.updateSubscription(subscriptionId, {
        plan: newPlan
      });

      return {
        subscription: updatedSubscription,
        change: this.mapDatabaseToSubscriptionChange(change)
      };
    } catch (error) {
      console.error('Failed to change subscription plan:', error);
      throw error;
    }
  }

  /**
   * Get subscription changes history
   */
  async getSubscriptionChanges(subscriptionId: string): Promise<SubscriptionChange[]> {
    try {
      const { data: changes, error } = await supabase
        .from('subscription_changes')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get subscription changes: ${error.message}`);
      }

      return changes.map(this.mapDatabaseToSubscriptionChange);
    } catch (error) {
      console.error('Failed to get subscription changes:', error);
      throw error;
    }
  }

  /**
   * Check if subscription has access to features
   */
  async checkSubscriptionAccess(userId: string, feature: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionByUserId(userId);
      
      if (!subscription || subscription.status !== 'active') {
        return false;
      }

      const plan = DEFAULT_PRICING_PLANS.find(p => p.tier === subscription.plan);
      if (!plan) {
        return false;
      }

      // Check feature access based on plan
      const featureMap: Record<string, Record<PricingTier, boolean>> = {
        'commercial_rights': {
          'pay-per-video': false,
          'basic': false,
          'premium': true
        },
        'api_access': {
          'pay-per-video': false,
          'basic': false,
          'premium': true
        },
        '4k_quality': {
          'pay-per-video': false,
          'basic': false,
          'premium': true
        },
        'custom_branding': {
          'pay-per-video': false,
          'basic': false,
          'premium': true
        },
        'priority_support': {
          'pay-per-video': false,
          'basic': false,
          'premium': true
        }
      };

      return featureMap[feature]?.[subscription.plan] || false;
    } catch (error) {
      console.error('Failed to check subscription access:', error);
      return false;
    }
  }

  /**
   * Get subscription usage limits
   */
  async getSubscriptionLimits(userId: string): Promise<{ videoLimit: number | null; hasCommercialRights: boolean }> {
    try {
      const subscription = await this.getSubscriptionByUserId(userId);
      
      if (!subscription || subscription.status !== 'active') {
        return { videoLimit: 0, hasCommercialRights: false };
      }

      const plan = DEFAULT_PRICING_PLANS.find(p => p.tier === subscription.plan);
      if (!plan) {
        return { videoLimit: 0, hasCommercialRights: false };
      }

      return {
        videoLimit: plan.videoLimit,
        hasCommercialRights: plan.commercialRights
      };
    } catch (error) {
      console.error('Failed to get subscription limits:', error);
      return { videoLimit: 0, hasCommercialRights: false };
    }
  }

  /**
   * Check if subscription is in trial period
   */
  isInTrial(subscription: Subscription): boolean {
    if (!subscription.trialStart || !subscription.trialEnd) {
      return false;
    }

    const now = new Date();
    return now >= subscription.trialStart && now <= subscription.trialEnd;
  }

  /**
   * Get days remaining in trial or subscription
   */
  getDaysRemaining(subscription: Subscription): number {
    const now = new Date();
    const endDate = this.isInTrial(subscription) ? subscription.trialEnd! : subscription.currentPeriodEnd;
    
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get subscription renewal date
   */
  getRenewalDate(subscription: Subscription): Date {
    return subscription.currentPeriodEnd;
  }

  /**
   * Check if subscription will be canceled at period end
   */
  willCancelAtPeriodEnd(subscription: Subscription): boolean {
    return subscription.cancelAtPeriodEnd;
  }

  /**
   * Map database record to Subscription type
   */
  private mapDatabaseToSubscription(dbSubscription: any): Subscription {
    return {
      id: dbSubscription.id,
      userId: dbSubscription.user_id,
      paddleSubscriptionId: dbSubscription.paddle_subscription_id,
      status: dbSubscription.status,
      plan: dbSubscription.plan,
      currentPeriodStart: new Date(dbSubscription.current_period_start),
      currentPeriodEnd: new Date(dbSubscription.current_period_end),
      cancelAtPeriodEnd: dbSubscription.cancel_at_period_end,
      canceledAt: dbSubscription.canceled_at ? new Date(dbSubscription.canceled_at) : undefined,
      trialStart: dbSubscription.trial_start ? new Date(dbSubscription.trial_start) : undefined,
      trialEnd: dbSubscription.trial_end ? new Date(dbSubscription.trial_end) : undefined,
      createdAt: new Date(dbSubscription.created_at),
      updatedAt: new Date(dbSubscription.updated_at),
      metadata: dbSubscription.metadata || {}
    };
  }

  /**
   * Map database record to SubscriptionChange type
   */
  private mapDatabaseToSubscriptionChange(dbChange: any): SubscriptionChange {
    return {
      id: dbChange.id,
      subscriptionId: dbChange.subscription_id,
      fromPlan: dbChange.from_plan,
      toPlan: dbChange.to_plan,
      effectiveDate: new Date(dbChange.effective_date),
      prorationAmount: dbChange.proration_amount,
      status: dbChange.status,
      createdAt: new Date(dbChange.created_at)
    };
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;