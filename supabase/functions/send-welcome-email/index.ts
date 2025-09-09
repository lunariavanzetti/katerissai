// =====================================================================================
// Kateriss AI Video Generator - User Onboarding Email Function
// Created: 2025-09-09
// Description: Automated welcome email system with onboarding sequences,
//              tier-specific content, and user engagement tracking
// =====================================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
}

interface OnboardingEmail {
  type: 'welcome' | 'tutorial' | 'tier_upgrade' | 'usage_reminder' | 'retention'
  recipientEmail: string
  recipientName: string
  userId: string
  tier: string
  templateVariables: Record<string, any>
  scheduledFor?: Date
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

interface OnboardingSequence {
  emails: Array<{
    type: string
    delayHours: number
    template: string
    condition?: string
  }>
}

// =====================================================================================
// EMAIL TEMPLATES
// =====================================================================================

const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  welcome_pay_per_video: {
    id: 'welcome_pay_per_video',
    name: 'Welcome - Pay Per Video',
    subject: '🎬 Welcome to Kateriss AI - Create Your First Video!',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Kateriss AI</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 8px 8px; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .feature { display: flex; align-items: center; margin: 15px 0; }
          .feature-icon { background: #f8f9fa; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎬 Welcome to Kateriss AI!</h1>
          <p>Create stunning AI-generated videos in minutes</p>
        </div>
        
        <div class="content">
          <h2>Hi {{userName}},</h2>
          
          <p>Welcome to the future of video creation! With Kateriss AI, you can transform your ideas into professional-quality videos using the power of artificial intelligence.</p>
          
          <div class="feature">
            <div class="feature-icon">🚀</div>
            <div>
              <strong>Quick Start:</strong> Create your first video in under 5 minutes
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">✨</div>
            <div>
              <strong>AI-Powered:</strong> Advanced AI creates unique videos from your prompts
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">💡</div>
            <div>
              <strong>Easy to Use:</strong> No video editing skills required
            </div>
          </div>
          
          <p>Ready to create your first AI video? Each video costs just $2.49, and you only pay for what you create.</p>
          
          <div style="text-align: center;">
            <a href="{{appUrl}}/generate" class="cta-button">Create Your First Video 🎥</a>
          </div>
          
          <h3>Getting Started Tips:</h3>
          <ul>
            <li><strong>Be specific:</strong> Detailed prompts create better videos</li>
            <li><strong>Choose your style:</strong> Realistic, animated, or artistic</li>
            <li><strong>Set the scene:</strong> Describe lighting, mood, and atmosphere</li>
          </ul>
          
          <p>Need inspiration? Check out our <a href="{{appUrl}}/examples">example gallery</a> to see what's possible!</p>
          
          <p>If you have any questions, just reply to this email. We're here to help!</p>
          
          <p>Happy creating,<br>The Kateriss AI Team</p>
        </div>
        
        <div class="footer">
          <p>© 2025 Kateriss AI. All rights reserved.</p>
          <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{appUrl}}/support">Support</a></p>
        </div>
      </body>
      </html>
    `,
    textContent: `
Welcome to Kateriss AI!

Hi {{userName}},

Welcome to the future of video creation! With Kateriss AI, you can transform your ideas into professional-quality videos using the power of artificial intelligence.

What you can do:
• Create videos in under 5 minutes
• Use advanced AI to generate unique content
• No video editing skills required

Ready to create your first AI video? Each video costs just $2.49, and you only pay for what you create.

Create your first video: {{appUrl}}/generate

Getting Started Tips:
- Be specific: Detailed prompts create better videos
- Choose your style: Realistic, animated, or artistic  
- Set the scene: Describe lighting, mood, and atmosphere

Need inspiration? Check out our examples: {{appUrl}}/examples

If you have any questions, just reply to this email. We're here to help!

Happy creating,
The Kateriss AI Team

Unsubscribe: {{unsubscribeUrl}}
    `,
    variables: ['userName', 'appUrl', 'unsubscribeUrl']
  },

  welcome_basic: {
    id: 'welcome_basic',
    name: 'Welcome - Basic Plan',
    subject: '🎉 Welcome to Kateriss AI Basic - 20 Videos Per Month!',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Kateriss AI Basic</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 8px 8px; }
          .cta-button { display: inline-block; background: #4facfe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .badge { background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .feature { display: flex; align-items: center; margin: 15px 0; }
          .feature-icon { background: #f8f9fa; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="badge">BASIC PLAN</span>
          <h1>🎉 Welcome to Kateriss AI!</h1>
          <p>You now have 20 video generations per month</p>
        </div>
        
        <div class="content">
          <h2>Hi {{userName}},</h2>
          
          <p>Congratulations on joining Kateriss AI Basic! You now have access to create up to 20 professional AI videos every month.</p>
          
          <div class="feature">
            <div class="feature-icon">🎯</div>
            <div>
              <strong>20 Videos Monthly:</strong> Perfect for regular content creation
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🏆</div>
            <div>
              <strong>Premium Templates:</strong> Access to exclusive video styles
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">⚡</div>
            <div>
              <strong>Priority Processing:</strong> Faster video generation
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">📧</div>
            <div>
              <strong>Email Support:</strong> Get help when you need it
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="{{appUrl}}/generate" class="cta-button">Start Creating Videos 🚀</a>
          </div>
          
          <h3>Pro Tips for Better Videos:</h3>
          <ul>
            <li><strong>Use premium templates:</strong> Try cinematic, dramatic, or artistic styles</li>
            <li><strong>Experiment with settings:</strong> Adjust duration and aspect ratio</li>
            <li><strong>Build a library:</strong> Create content consistently throughout the month</li>
          </ul>
          
          <p>Your videos reset on the {{resetDate}} of each month, so make sure to use your allocation!</p>
          
          <p>Ready to create something amazing?</p>
          
          <p>Best regards,<br>The Kateriss AI Team</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
Welcome to Kateriss AI Basic!

Hi {{userName}},

Congratulations on joining Kateriss AI Basic! You now have access to create up to 20 professional AI videos every month.

Your Basic Plan includes:
• 20 Videos Monthly - Perfect for regular content creation
• Premium Templates - Access to exclusive video styles  
• Priority Processing - Faster video generation
• Email Support - Get help when you need it

Start creating: {{appUrl}}/generate

Pro Tips:
- Use premium templates: Try cinematic, dramatic, or artistic styles
- Experiment with settings: Adjust duration and aspect ratio
- Build a library: Create content consistently throughout the month

Your videos reset on the {{resetDate}} of each month.

Best regards,
The Kateriss AI Team
    `,
    variables: ['userName', 'appUrl', 'resetDate', 'unsubscribeUrl']
  },

  welcome_premium: {
    id: 'welcome_premium',
    name: 'Welcome - Premium Plan',
    subject: '👑 Welcome to Kateriss AI Premium - Unlimited Power!',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Kateriss AI Premium</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); color: #2d3436; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 8px 8px; }
          .cta-button { display: inline-block; background: #fdcb6e; color: #2d3436; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .badge { background: #f39c12; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .feature { display: flex; align-items: center; margin: 15px 0; }
          .feature-icon { background: #fff3cd; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="badge">👑 PREMIUM</span>
          <h1>Welcome to the Ultimate Experience!</h1>
          <p>Unlimited videos, 4K quality, and exclusive features</p>
        </div>
        
        <div class="content">
          <h2>Hi {{userName}},</h2>
          
          <p>Welcome to Kateriss AI Premium - the ultimate video creation experience! You now have unlimited access to our most powerful features.</p>
          
          <div class="feature">
            <div class="feature-icon">∞</div>
            <div>
              <strong>Unlimited Videos:</strong> Create as many videos as you want
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">📺</div>
            <div>
              <strong>4K Quality:</strong> Ultra-high definition output available
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🎨</div>
            <div>
              <strong>All Premium Templates:</strong> Access to every style and template
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">⚡</div>
            <div>
              <strong>Fastest Processing:</strong> Jump to the front of the queue
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">💼</div>
            <div>
              <strong>Commercial License:</strong> Use videos for business purposes
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🔑</div>
            <div>
              <strong>API Access:</strong> Integrate with your own applications
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="{{appUrl}}/generate" class="cta-button">Start Creating Unlimited Videos 🎬</a>
          </div>
          
          <h3>Exclusive Premium Features:</h3>
          <ul>
            <li><strong>API Key:</strong> Access at {{appUrl}}/api-keys (generated automatically)</li>
            <li><strong>Custom Branding:</strong> Remove watermarks and add your logo</li>
            <li><strong>Priority Support:</strong> Direct line to our team</li>
            <li><strong>Beta Features:</strong> First access to new capabilities</li>
          </ul>
          
          <p><strong>Your API Key:</strong> {{apiKey}}</p>
          
          <p>Ready to unleash unlimited creativity?</p>
          
          <p>Best regards,<br>The Kateriss AI Team</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
Welcome to Kateriss AI Premium!

Hi {{userName}},

Welcome to Kateriss AI Premium - the ultimate video creation experience! You now have unlimited access to our most powerful features.

Premium Features:
• Unlimited Videos - Create as many as you want
• 4K Quality - Ultra-high definition output
• All Premium Templates - Access to every style
• Fastest Processing - Jump to the front of the queue  
• Commercial License - Use videos for business
• API Access - Integrate with your applications

Your API Key: {{apiKey}}

Exclusive Premium Features:
- Custom Branding: Remove watermarks and add your logo
- Priority Support: Direct line to our team
- Beta Features: First access to new capabilities

Start creating: {{appUrl}}/generate
Manage API keys: {{appUrl}}/api-keys

Best regards,
The Kateriss AI Team
    `,
    variables: ['userName', 'appUrl', 'apiKey', 'unsubscribeUrl']
  }
}

// =====================================================================================
// ONBOARDING SEQUENCES
// =====================================================================================

const ONBOARDING_SEQUENCES: Record<string, OnboardingSequence> = {
  'pay-per-video': {
    emails: [
      { type: 'welcome', delayHours: 0, template: 'welcome_pay_per_video' },
      { type: 'tutorial', delayHours: 24, template: 'tutorial_basics', condition: 'no_videos_created' },
      { type: 'usage_reminder', delayHours: 168, template: 'usage_reminder', condition: 'no_recent_activity' }
    ]
  },
  'basic': {
    emails: [
      { type: 'welcome', delayHours: 0, template: 'welcome_basic' },
      { type: 'tutorial', delayHours: 24, template: 'tutorial_advanced' },
      { type: 'usage_reminder', delayHours: 168, template: 'monthly_usage_reminder' }
    ]
  },
  'premium': {
    emails: [
      { type: 'welcome', delayHours: 0, template: 'welcome_premium' },
      { type: 'tutorial', delayHours: 24, template: 'tutorial_premium' },
      { type: 'retention', delayHours: 168, template: 'premium_features_spotlight' }
    ]
  }
}

// =====================================================================================
// EMAIL SENDING FUNCTIONS
// =====================================================================================

async function sendEmail(
  email: OnboardingEmail,
  template: EmailTemplate
): Promise<EmailResult> {
  try {
    // Replace template variables
    let subject = template.subject
    let htmlContent = template.htmlContent
    let textContent = template.textContent
    
    for (const [key, value] of Object.entries(email.templateVariables)) {
      const placeholder = `{{${key}}}`
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value))
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), String(value))
      textContent = textContent.replace(new RegExp(placeholder, 'g'), String(value))
    }
    
    // Use your preferred email service (SendGrid, Resend, etc.)
    const emailApiKey = Deno.env.get('EMAIL_API_KEY')!
    const emailEndpoint = Deno.env.get('EMAIL_ENDPOINT') || 'https://api.sendgrid.v3/mail/send'
    
    const emailPayload = {
      personalizations: [{
        to: [{ email: email.recipientEmail, name: email.recipientName }],
        subject: subject
      }],
      from: { 
        email: 'hello@kateriss.ai', 
        name: 'Kateriss AI'
      },
      content: [
        {
          type: 'text/plain',
          value: textContent
        },
        {
          type: 'text/html',
          value: htmlContent
        }
      ],
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true }
      },
      custom_args: {
        user_id: email.userId,
        email_type: email.type,
        template_id: template.id
      }
    }
    
    console.log(`Sending ${email.type} email to ${email.recipientEmail}`)
    
    const response = await fetch(emailEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })
    
    if (!response.ok) {
      throw new Error(`Email API error: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    return {
      success: true,
      messageId: result.message_id || result.id
    }
    
  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function scheduleOnboardingSequence(
  supabase: any,
  userId: string,
  tier: string,
  userEmail: string,
  userName: string
): Promise<void> {
  const sequence = ONBOARDING_SEQUENCES[tier]
  if (!sequence) {
    console.log(`No onboarding sequence defined for tier: ${tier}`)
    return
  }
  
  for (const emailConfig of sequence.emails) {
    const scheduledTime = new Date()
    scheduledTime.setHours(scheduledTime.getHours() + emailConfig.delayHours)
    
    // Store scheduled email in database
    await supabase
      .from('scheduled_emails')
      .insert({
        user_id: userId,
        email_type: emailConfig.type,
        template_id: emailConfig.template,
        recipient_email: userEmail,
        recipient_name: userName,
        tier: tier,
        scheduled_for: scheduledTime.toISOString(),
        condition_check: emailConfig.condition,
        status: 'scheduled'
      })
  }
}

async function processScheduledEmails(supabase: any): Promise<{
  processed: number
  sent: number
  errors: string[]
}> {
  const result = {
    processed: 0,
    sent: 0,
    errors: []
  }
  
  try {
    // Get emails ready to be sent
    const { data: scheduledEmails, error } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50)
    
    if (error) {
      result.errors.push(`Error fetching scheduled emails: ${error.message}`)
      return result
    }
    
    if (!scheduledEmails || scheduledEmails.length === 0) {
      return result
    }
    
    for (const scheduledEmail of scheduledEmails) {
      result.processed++
      
      try {
        // Check condition if specified
        if (scheduledEmail.condition_check) {
          const conditionMet = await checkEmailCondition(
            supabase, 
            scheduledEmail.user_id, 
            scheduledEmail.condition_check
          )
          
          if (!conditionMet) {
            // Mark as skipped
            await supabase
              .from('scheduled_emails')
              .update({ status: 'skipped', processed_at: new Date().toISOString() })
              .eq('id', scheduledEmail.id)
            continue
          }
        }
        
        // Prepare email data
        const templateVariables = await getTemplateVariables(
          supabase,
          scheduledEmail.user_id,
          scheduledEmail.tier
        )
        
        const email: OnboardingEmail = {
          type: scheduledEmail.email_type,
          recipientEmail: scheduledEmail.recipient_email,
          recipientName: scheduledEmail.recipient_name,
          userId: scheduledEmail.user_id,
          tier: scheduledEmail.tier,
          templateVariables: templateVariables
        }
        
        const template = EMAIL_TEMPLATES[scheduledEmail.template_id]
        if (!template) {
          result.errors.push(`Template not found: ${scheduledEmail.template_id}`)
          continue
        }
        
        // Send email
        const emailResult = await sendEmail(email, template)
        
        if (emailResult.success) {
          result.sent++
          
          // Mark as sent
          await supabase
            .from('scheduled_emails')
            .update({
              status: 'sent',
              processed_at: new Date().toISOString(),
              message_id: emailResult.messageId
            })
            .eq('id', scheduledEmail.id)
            
          // Create email log
          await supabase
            .from('email_logs')
            .insert({
              user_id: scheduledEmail.user_id,
              email_type: scheduledEmail.email_type,
              template_id: scheduledEmail.template_id,
              recipient_email: scheduledEmail.recipient_email,
              status: 'sent',
              message_id: emailResult.messageId,
              sent_at: new Date().toISOString()
            })
            
        } else {
          result.errors.push(
            `Failed to send ${scheduledEmail.email_type} to ${scheduledEmail.recipient_email}: ${emailResult.error}`
          )
          
          // Mark as failed
          await supabase
            .from('scheduled_emails')
            .update({
              status: 'failed',
              processed_at: new Date().toISOString(),
              error: emailResult.error
            })
            .eq('id', scheduledEmail.id)
        }
        
      } catch (emailError) {
        result.errors.push(`Error processing email ${scheduledEmail.id}: ${emailError.message}`)
      }
    }
    
    return result
    
  } catch (error) {
    result.errors.push(`Processing error: ${error.message}`)
    return result
  }
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

async function checkEmailCondition(
  supabase: any,
  userId: string,
  condition: string
): Promise<boolean> {
  try {
    switch (condition) {
      case 'no_videos_created':
        const { count } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
        return count === 0
        
      case 'no_recent_activity':
        const { data: recentVideos } = await supabase
          .from('videos')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1)
        return !recentVideos || recentVideos.length === 0
        
      default:
        return true
    }
  } catch (error) {
    console.error(`Error checking condition ${condition}:`, error)
    return false
  }
}

async function getTemplateVariables(
  supabase: any,
  userId: string,
  tier: string
): Promise<Record<string, any>> {
  const variables: Record<string, any> = {
    appUrl: Deno.env.get('APP_URL') || 'https://kateriss.ai',
    unsubscribeUrl: `${Deno.env.get('APP_URL')}/unsubscribe?user=${userId}`,
    supportUrl: `${Deno.env.get('APP_URL')}/support`,
    userName: 'there' // default fallback
  }
  
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, created_at, api_key_hash')
      .eq('id', userId)
      .single()
    
    if (profile) {
      variables.userName = profile.full_name || profile.email.split('@')[0]
      variables.userEmail = profile.email
      
      // Calculate reset date for subscription users
      if (tier === 'basic' || tier === 'premium') {
        const resetDate = new Date(profile.created_at)
        resetDate.setMonth(resetDate.getMonth() + 1)
        variables.resetDate = resetDate.toLocaleDateString()
      }
    }
    
    // Get API key for premium users
    if (tier === 'premium') {
      const { data: apiKey } = await supabase
        .from('api_keys')
        .select('key_prefix')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      variables.apiKey = apiKey?.key_prefix || 'Generated automatically'
    }
    
    // Get usage statistics
    const { data: usage } = await supabase
      .from('usage')
      .select('videos_generated, videos_limit')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (usage) {
      variables.videosGenerated = usage.videos_generated
      variables.videosRemaining = usage.videos_limit ? 
        usage.videos_limit - usage.videos_generated : 'Unlimited'
    }
    
    return variables
    
  } catch (error) {
    console.error('Error getting template variables:', error)
    return variables
  }
}

// =====================================================================================
// MAIN EMAIL FUNCTION
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
      case 'welcome': {
        // Send immediate welcome email
        const body = await req.json()
        const { userId, tier, userEmail, userName } = body
        
        if (!userId || !tier || !userEmail) {
          throw new Error('Missing required fields: userId, tier, userEmail')
        }
        
        const templateId = `welcome_${tier.replace('-', '_')}`
        const template = EMAIL_TEMPLATES[templateId]
        
        if (!template) {
          throw new Error(`Template not found: ${templateId}`)
        }
        
        const templateVariables = await getTemplateVariables(supabase, userId, tier)
        
        const email: OnboardingEmail = {
          type: 'welcome',
          recipientEmail: userEmail,
          recipientName: userName || templateVariables.userName,
          userId: userId,
          tier: tier,
          templateVariables: templateVariables
        }
        
        const result = await sendEmail(email, template)
        
        if (result.success) {
          // Schedule follow-up emails
          await scheduleOnboardingSequence(
            supabase, 
            userId, 
            tier, 
            userEmail, 
            userName || templateVariables.userName
          )
          
          // Log the email
          await supabase
            .from('email_logs')
            .insert({
              user_id: userId,
              email_type: 'welcome',
              template_id: templateId,
              recipient_email: userEmail,
              status: 'sent',
              message_id: result.messageId,
              sent_at: new Date().toISOString()
            })
        }
        
        return new Response(
          JSON.stringify(result),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      case 'process': {
        // Process scheduled emails
        const result = await processScheduledEmails(supabase)
        
        return new Response(
          JSON.stringify(result),
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
    console.error('Email function error:', error)
    
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