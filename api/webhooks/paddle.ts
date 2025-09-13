// Paddle Webhook Handler for Kateriss AI Video Generator
// Handles payment events and subscription updates

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for webhook
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Paddle webhook signature verification (if needed)
function verifyWebhookSignature(body: string, signature: string): boolean {
  // Implement signature verification if Paddle provides it
  // For now, we'll accept all webhooks (sandbox testing)
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['paddle-signature'] as string;

    console.log('🪝 Paddle webhook received:', {
      headers: req.headers,
      body: req.body
    });

    // Verify webhook signature (optional but recommended)
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const eventType = event.event_type || event.type;

    console.log('📦 Processing Paddle event:', eventType);

    // Handle different event types
    switch (eventType) {
      case 'transaction.completed':
        await handleTransactionCompleted(event);
        break;
        
      case 'subscription.created':
        await handleSubscriptionCreated(event);
        break;
        
      case 'subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
        
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event);
        break;
        
      case 'transaction.payment_failed':
        await handlePaymentFailed(event);
        break;
        
      default:
        console.log('📝 Unhandled event type:', eventType);
    }

    // Respond with success
    res.status(200).json({ success: true, received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Handle successful transaction
async function handleTransactionCompleted(event: any) {
  try {
    const customData = event.data?.custom_data || {};
    const userId = customData.userId;
    const amount = event.data?.totals?.total;
    const currency = event.data?.currency_code;

    console.log('💰 Transaction completed:', {
      userId,
      amount,
      currency,
      transactionId: event.data?.id
    });

    if (!userId) {
      console.warn('⚠️ No userId in custom_data, skipping user update');
      return;
    }

    // Update user's payment status or credits
    const { error } = await supabase
      .from('user_profiles')
      .update({
        last_payment_date: new Date().toISOString(),
        total_spent: supabase.sql`COALESCE(total_spent, 0) + ${amount}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Failed to update user profile:', error);
    } else {
      console.log('✅ User payment status updated');
    }

  } catch (error) {
    console.error('❌ Error handling transaction completion:', error);
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(event: any) {
  try {
    const customData = event.data?.custom_data || {};
    const userId = customData.userId;
    const subscriptionId = event.data?.id;
    const priceId = event.data?.items?.[0]?.price?.id;

    console.log('🔄 Subscription created:', {
      userId,
      subscriptionId,
      priceId
    });

    if (!userId) {
      console.warn('⚠️ No userId in custom_data, skipping subscription creation');
      return;
    }

    // Create subscription record
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        paddle_subscription_id: subscriptionId,
        price_id: priceId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: event.data?.next_billed_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Failed to create subscription:', error);
    } else {
      console.log('✅ Subscription created in database');
    }

  } catch (error) {
    console.error('❌ Error handling subscription creation:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(event: any) {
  try {
    const subscriptionId = event.data?.id;
    const status = event.data?.status;

    console.log('🔄 Subscription updated:', {
      subscriptionId,
      status
    });

    // Update subscription status
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: status,
        current_period_end: event.data?.next_billed_at,
        updated_at: new Date().toISOString()
      })
      .eq('paddle_subscription_id', subscriptionId);

    if (error) {
      console.error('❌ Failed to update subscription:', error);
    } else {
      console.log('✅ Subscription updated in database');
    }

  } catch (error) {
    console.error('❌ Error handling subscription update:', error);
  }
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(event: any) {
  try {
    const subscriptionId = event.data?.id;

    console.log('❌ Subscription canceled:', { subscriptionId });

    // Update subscription status to canceled
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('paddle_subscription_id', subscriptionId);

    if (error) {
      console.error('❌ Failed to cancel subscription:', error);
    } else {
      console.log('✅ Subscription canceled in database');
    }

  } catch (error) {
    console.error('❌ Error handling subscription cancellation:', error);
  }
}

// Handle payment failures
async function handlePaymentFailed(event: any) {
  try {
    const customData = event.data?.custom_data || {};
    const userId = customData.userId;

    console.log('💳 Payment failed:', {
      userId,
      transactionId: event.data?.id
    });

    // You could implement retry logic, email notifications, etc.
    // For now, just log the failure

  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
  }
}