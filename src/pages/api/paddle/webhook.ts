// Paddle Webhook Handler for Kateriss AI Video Generator
// Handles subscription and transaction events from Paddle

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../config/supabase';

// Paddle webhook event types we care about
interface PaddleWebhookEvent {
  event_type: string;
  data: any;
  notification_id: string;
  occurred_at: string;
}

interface SubscriptionData {
  id: string;
  customer_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  items: Array<{
    price: {
      id: string;
      product_id: string;
    };
  }>;
  billing_cycle: {
    frequency: number;
    interval: 'day' | 'week' | 'month' | 'year';
  };
  current_billing_period: {
    starts_at: string;
    ends_at: string;
  };
  created_at: string;
  updated_at: string;
}

interface TransactionData {
  id: string;
  customer_id: string;
  status: 'completed' | 'pending' | 'failed';
  items: Array<{
    price: {
      id: string;
      product_id: string;
    };
    quantity: number;
  }>;
  details: {
    totals: {
      grand_total: string;
      currency_code: string;
    };
  };
  billing_period: {
    starts_at: string;
    ends_at: string;
  } | null;
  created_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event: PaddleWebhookEvent = req.body;
    
    console.log('📬 Paddle webhook received:', event.event_type);
    
    switch (event.event_type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data as SubscriptionData);
        break;
        
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data as SubscriptionData);
        break;
        
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data as SubscriptionData);
        break;
        
      case 'transaction.completed':
        await handleTransactionCompleted(event.data as TransactionData);
        break;
        
      case 'transaction.payment_failed':
        await handlePaymentFailed(event.data as TransactionData);
        break;
        
      default:
        console.log('ℹ️ Unhandled webhook event:', event.event_type);
    }
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSubscriptionCreated(data: SubscriptionData) {
  console.log('✅ Subscription created:', data.id);
  
  // Get the customer's user ID from Paddle customer ID
  const userId = await getUserIdFromCustomerId(data.customer_id);
  if (!userId) {
    console.error('User not found for customer:', data.customer_id);
    return;
  }
  
  // Determine plan tier from price ID
  const planTier = getPlanTierFromPriceId(data.items[0]?.price?.id);
  
  // Create subscription record
  await supabase.from('subscriptions').insert({
    user_id: userId,
    paddle_subscription_id: data.id,
    paddle_customer_id: data.customer_id,
    plan_id: data.items[0]?.price?.id,
    plan_name: planTier,
    status: data.status,
    current_period_start: data.current_billing_period.starts_at,
    current_period_end: data.current_billing_period.ends_at,
    created_at: data.created_at,
    updated_at: data.updated_at
  });
  
  // Update user profile with subscription tier
  await supabase.from('profiles').update({
    subscription_tier: planTier,
    subscription_id: data.id
  }).eq('id', userId);
  
  // Update user usage based on plan
  const usage = getUsageForPlan(planTier);
  await supabase.from('user_usage').update({
    plan: planTier,
    credits_total: usage.credits,
    credits_remaining: usage.credits,
    videos_per_month_limit: usage.videoLimit,
    reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }).eq('user_id', userId);
}

async function handleSubscriptionUpdated(data: SubscriptionData) {
  console.log('🔄 Subscription updated:', data.id);
  
  // Update subscription record
  await supabase.from('subscriptions').update({
    status: data.status,
    current_period_start: data.current_billing_period.starts_at,
    current_period_end: data.current_billing_period.ends_at,
    updated_at: data.updated_at
  }).eq('paddle_subscription_id', data.id);
}

async function handleSubscriptionCanceled(data: SubscriptionData) {
  console.log('❌ Subscription canceled:', data.id);
  
  const userId = await getUserIdFromCustomerId(data.customer_id);
  if (!userId) return;
  
  // Update subscription status
  await supabase.from('subscriptions').update({
    status: 'canceled',
    canceled_at: new Date().toISOString(),
    updated_at: data.updated_at
  }).eq('paddle_subscription_id', data.id);
  
  // Revert user to pay-per-video
  await supabase.from('profiles').update({
    subscription_tier: 'pay-per-video',
    subscription_id: null
  }).eq('id', userId);
  
  // Reset usage to pay-per-video limits
  await supabase.from('user_usage').update({
    plan: 'pay-per-video',
    credits_total: 0,
    credits_remaining: 0,
    videos_per_month_limit: 0
  }).eq('user_id', userId);
}

async function handleTransactionCompleted(data: TransactionData) {
  console.log('💰 Transaction completed:', data.id);
  
  const userId = await getUserIdFromCustomerId(data.customer_id);
  if (!userId) return;
  
  const priceId = data.items[0]?.price?.id;
  const isPayPerVideo = priceId === process.env.VITE_PADDLE_PAY_PER_VIDEO_PRICE_ID;
  
  // Record transaction
  await supabase.from('payment_transactions').insert({
    user_id: userId,
    paddle_transaction_id: data.id,
    type: isPayPerVideo ? 'one_time' : 'subscription',
    amount: parseInt(data.details.totals.grand_total) * 100, // Convert to cents
    currency: data.details.totals.currency_code,
    status: 'completed',
    credits_purchased: isPayPerVideo ? 1 : 0,
    description: isPayPerVideo ? 'Pay-per-video purchase' : 'Subscription payment'
  });
  
  // If pay-per-video, add credits
  if (isPayPerVideo) {
    await supabase.from('user_usage').update({
      credits_remaining: supabase.raw('credits_remaining + 1')
    }).eq('user_id', userId);
  }
}

async function handlePaymentFailed(data: TransactionData) {
  console.log('⚠️ Payment failed:', data.id);
  
  const userId = await getUserIdFromCustomerId(data.customer_id);
  if (!userId) return;
  
  // Record failed transaction
  await supabase.from('payment_transactions').insert({
    user_id: userId,
    paddle_transaction_id: data.id,
    type: 'subscription',
    amount: parseInt(data.details.totals.grand_total) * 100,
    currency: data.details.totals.currency_code,
    status: 'failed',
    description: 'Payment failed'
  });
}

async function getUserIdFromCustomerId(paddleCustomerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('paddle_customer_id', paddleCustomerId)
    .single();
    
  if (error || !data) {
    console.error('User not found for Paddle customer:', paddleCustomerId);
    return null;
  }
  
  return data.id;
}

function getPlanTierFromPriceId(priceId: string): string {
  if (priceId === process.env.VITE_PADDLE_PAY_PER_VIDEO_PRICE_ID) {
    return 'pay-per-video';
  } else if (priceId === process.env.VITE_PADDLE_BASIC_MONTHLY_PRICE_ID) {
    return 'basic';
  } else if (priceId === process.env.VITE_PADDLE_PREMIUM_MONTHLY_PRICE_ID) {
    return 'premium';
  }
  return 'pay-per-video';
}

function getUsageForPlan(planTier: string) {
  switch (planTier) {
    case 'basic':
      return { credits: 20, videoLimit: 20 };
    case 'premium':
      return { credits: 9999, videoLimit: 9999 };
    default:
      return { credits: 0, videoLimit: 0 };
  }
}