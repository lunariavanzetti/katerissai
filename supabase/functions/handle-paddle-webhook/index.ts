// =====================================================================================
// Kateriss AI Video Generator - Paddle Webhook Handler
// Created: 2025-09-09
// Description: Comprehensive Paddle webhook processing for subscription management,
//              payment handling, and user lifecycle automation
// =====================================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

interface PaddleWebhookEvent {
  alert_id: string
  alert_name: string
  cancel_url?: string
  checkout_id?: string
  currency: string
  customer_name?: string
  email: string
  event_time: string
  marketing_consent?: string
  next_bill_date?: string
  order_id?: string
  passthrough?: string
  quantity?: string
  receipt_url?: string
  status?: string
  subscription_id?: string
  subscription_plan_id?: string
  unit_price?: string
  user_id?: string
  p_signature: string
  // Payment specific fields
  payment_id?: string
  amount?: string
  fee?: string
  earnings?: string
  // Subscription specific fields  
  subscription_payment_id?: string
  instalments?: string
  // Refund specific fields
  refund_type?: string
  refund_reason?: string
  gross_refund?: string
  // Plan change fields
  old_price?: string
  new_price?: string
  old_quantity?: string
  new_quantity?: string
}

interface WebhookResponse {
  success: boolean
  message: string
  data?: any
}

// =====================================================================================
// WEBHOOK VALIDATION
// =====================================================================================

function validatePaddleSignature(
  data: Record<string, any>,
  signature: string,
  publicKey: string
): boolean {
  try {
    // Remove signature from data
    const { p_signature, ...payloadData } = data
    
    // Sort keys and create query string
    const sortedKeys = Object.keys(payloadData).sort()
    const queryString = sortedKeys
      .map(key => {
        const value = payloadData[key]
        return `${key}=${encodeURIComponent(String(value))}`
      })
      .join('&')
    
    // In a real implementation, you would verify the signature using Paddle's public key
    // For now, we'll do basic validation
    console.log('Webhook signature validation:', { signature, queryString })
    
    // TODO: Implement proper RSA signature verification with Paddle's public key
    return signature.length > 0
  } catch (error) {
    console.error('Signature validation error:', error)
    return false
  }
}

// =====================================================================================
// WEBHOOK EVENT HANDLERS
// =====================================================================================

async function handleSubscriptionCreated(
  supabase: any,
  event: PaddleWebhookEvent
): Promise<WebhookResponse> {
  try {
    const userEmail = event.email
    const subscriptionId = event.subscription_id!
    const planId = event.subscription_plan_id!
    const status = event.status || 'active'
    
    // Map Paddle plan ID to our pricing tier
    const planMapping: Record<string, string> = {
      'basic_monthly_plan': 'basic',
      'premium_monthly_plan': 'premium',
      'basic_yearly_plan': 'basic',
      'premium_yearly_plan': 'premium'
    }
    
    const pricingTier = planMapping[planId] || 'basic'
    
    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single()
    
    if (profileError || !profile) {
      throw new Error(`User not found for email: ${userEmail}`)
    }
    
    // Calculate period dates
    const currentPeriodStart = new Date(event.event_time)
    const currentPeriodEnd = new Date(currentPeriodStart)
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    
    // Create subscription using database function
    const { error: subscriptionError } = await supabase.rpc(
      'handle_subscription_change',
      {
        p_user_id: profile.id,
        p_paddle_subscription_id: subscriptionId,
        p_status: status,
        p_plan: pricingTier,
        p_period_start: currentPeriodStart.toISOString(),
        p_period_end: currentPeriodEnd.toISOString(),
        p_metadata: {
          paddle_plan_id: planId,
          currency: event.currency,
          amount: event.unit_price,
          checkout_id: event.checkout_id
        }
      }
    )
    
    if (subscriptionError) {
      throw subscriptionError
    }
    
    return {
      success: true,
      message: 'Subscription created successfully',
      data: { userId: profile.id, subscriptionId }
    }
  } catch (error) {
    console.error('Error handling subscription created:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(
  supabase: any,
  event: PaddleWebhookEvent
): Promise<WebhookResponse> {
  try {
    const subscriptionId = event.subscription_id!
    const status = event.status || 'active'
    
    // Update subscription status
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('paddle_subscription_id', subscriptionId)
    
    if (error) {
      throw error
    }
    
    return {
      success: true,
      message: 'Subscription updated successfully',
      data: { subscriptionId, status }
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error)
    throw error
  }
}

async function handleSubscriptionCancelled(
  supabase: any,
  event: PaddleWebhookEvent
): Promise<WebhookResponse> {
  try {
    const subscriptionId = event.subscription_id!
    
    // Cancel subscription using database function
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('paddle_subscription_id', subscriptionId)
      .single()
    
    if (subscription) {
      const { error } = await supabase.rpc('cancel_subscription', {
        p_subscription_id: subscription.id,
        p_immediately: true
      })
      
      if (error) {
        throw error
      }
    }
    
    return {
      success: true,
      message: 'Subscription cancelled successfully',
      data: { subscriptionId }
    }
  } catch (error) {
    console.error('Error handling subscription cancelled:', error)
    throw error
  }
}

async function handlePaymentSucceeded(
  supabase: any,
  event: PaddleWebhookEvent
): Promise<WebhookResponse> {
  try {
    const userEmail = event.email
    const orderId = event.order_id!
    const amount = parseFloat(event.unit_price || '0')
    const currency = event.currency
    
    // Find user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single()
    
    if (!profile) {
      throw new Error(`User not found for email: ${userEmail}`)
    }
    
    // Create payment record
    const paymentData = {
      user_id: profile.id,
      paddle_order_id: orderId,
      paddle_checkout_id: event.checkout_id,
      amount: amount,
      currency: currency,
      status: 'completed',
      type: event.subscription_id ? 'subscription' : 'one-time',
      description: event.subscription_id 
        ? `Subscription payment for ${event.subscription_plan_id}`
        : 'One-time video generation payment',
      video_count: event.subscription_id ? null : 1,
      receipt_url: event.receipt_url,
      paid_at: new Date(event.event_time).toISOString(),
      metadata: {
        paddle_payment_id: event.payment_id,
        fee: event.fee,
        earnings: event.earnings,
        quantity: event.quantity
      }
    }
    
    const { error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
    
    if (paymentError) {
      throw paymentError
    }
    
    // If this is a one-time payment, add credits to user
    if (!event.subscription_id) {
      await supabase.rpc('record_usage_event', {
        p_user_id: profile.id,
        p_type: 'video_generated',
        p_count: -1, // Add credit
        p_metadata: { payment_id: orderId }
      })
    }
    
    return {
      success: true,
      message: 'Payment processed successfully',
      data: { userId: profile.id, orderId, amount }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
    throw error
  }
}

async function handlePaymentRefunded(
  supabase: any,
  event: PaddleWebhookEvent
): Promise<WebhookResponse> {
  try {
    const orderId = event.order_id!
    const refundAmount = parseFloat(event.gross_refund || '0')
    
    // Update payment record
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refunded_at: new Date(event.event_time).toISOString(),
        metadata: {
          refund_type: event.refund_type,
          refund_reason: event.refund_reason,
          refund_amount: refundAmount
        }
      })
      .eq('paddle_order_id', orderId)
    
    if (error) {
      throw error
    }
    
    return {
      success: true,
      message: 'Refund processed successfully',
      data: { orderId, refundAmount }
    }
  } catch (error) {
    console.error('Error handling payment refunded:', error)
    throw error
  }
}

// =====================================================================================
// MAIN WEBHOOK HANDLER
// =====================================================================================

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse webhook payload
    const body = await req.text()
    const formData = new URLSearchParams(body)
    const webhookData: Record<string, any> = {}
    
    for (const [key, value] of formData.entries()) {
      webhookData[key] = value
    }
    
    console.log('Received Paddle webhook:', webhookData.alert_name)
    
    // Validate signature
    const paddlePublicKey = Deno.env.get('PADDLE_PUBLIC_KEY')!
    const isValid = validatePaddleSignature(
      webhookData,
      webhookData.p_signature,
      paddlePublicKey
    )
    
    if (!isValid) {
      console.error('Invalid webhook signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Store webhook event for audit
    await supabase
      .from('webhook_events')
      .insert({
        paddle_alert_id: webhookData.alert_id,
        event_type: webhookData.alert_name,
        data: webhookData,
        processed: false
      })
    
    let result: WebhookResponse
    
    // Route to appropriate handler based on event type
    switch (webhookData.alert_name) {
      case 'subscription_created':
        result = await handleSubscriptionCreated(supabase, webhookData as PaddleWebhookEvent)
        break
        
      case 'subscription_updated':
        result = await handleSubscriptionUpdated(supabase, webhookData as PaddleWebhookEvent)
        break
        
      case 'subscription_cancelled':
        result = await handleSubscriptionCancelled(supabase, webhookData as PaddleWebhookEvent)
        break
        
      case 'payment_succeeded':
      case 'subscription_payment_succeeded':
        result = await handlePaymentSucceeded(supabase, webhookData as PaddleWebhookEvent)
        break
        
      case 'payment_refunded':
      case 'subscription_payment_refunded':
        result = await handlePaymentRefunded(supabase, webhookData as PaddleWebhookEvent)
        break
        
      default:
        console.log(`Unhandled webhook event: ${webhookData.alert_name}`)
        result = {
          success: true,
          message: `Event ${webhookData.alert_name} received but not processed`
        }
    }
    
    // Mark webhook as processed
    await supabase
      .from('webhook_events')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('paddle_alert_id', webhookData.alert_id)
    
    console.log('Webhook processed successfully:', result)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Try to update webhook event with error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      const body = await req.clone().text()
      const formData = new URLSearchParams(body)
      const alertId = formData.get('alert_id')
      
      if (alertId) {
        await supabase
          .from('webhook_events')
          .update({
            error: { message: error.message, stack: error.stack },
            retry_count: 1
          })
          .eq('paddle_alert_id', alertId)
      }
    } catch (updateError) {
      console.error('Failed to update webhook event with error:', updateError)
    }
    
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