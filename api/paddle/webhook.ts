// Paddle Webhook Handler for Kateriss AI Video Generator
// Handles subscription and transaction events from Paddle

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple webhook handler for now
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    console.log('📬 Paddle webhook received:', event.event_type || 'unknown');
    console.log('Data:', JSON.stringify(event, null, 2));
    
    // For now, just log the webhooks
    // TODO: Process subscription and transaction events
    
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook received',
      event_type: event.event_type 
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}