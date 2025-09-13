// Paddle Server-Side Checkout Creation API
// Creates checkout sessions using Paddle's server-side API

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, quantity = 1, customerEmail, customData } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    console.log('🔧 Creating Paddle checkout session:', {
      priceId,
      quantity,
      customerEmail,
      customData
    });

    // Paddle API configuration
    const paddleApiKey = process.env.VITE_PADDLE_API_KEY;
    const paddleEnvironment = process.env.VITE_PADDLE_ENVIRONMENT || 'sandbox';
    
    if (!paddleApiKey) {
      console.error('❌ Paddle API key not configured');
      return res.status(500).json({ error: 'Paddle API key not configured' });
    }

    // Determine API base URL
    const apiBaseUrl = paddleEnvironment === 'production' 
      ? 'https://api.paddle.com'
      : 'https://sandbox-api.paddle.com';

    // Create transaction request
    const transactionData = {
      items: [{
        price_id: priceId,
        quantity: quantity
      }],
      customer: customerEmail ? {
        email: customerEmail
      } : undefined,
      custom_data: customData
      // Remove checkout URL until domain is approved
      // checkout: {
      //   url: `${process.env.VERCEL_URL || 'https://katerissai.vercel.app'}/dashboard?payment=success`
      // }
    };

    console.log('🚀 Sending request to Paddle API:', apiBaseUrl);
    console.log('📦 Transaction data:', JSON.stringify(transactionData, null, 2));

    // Make request to Paddle API
    const response = await fetch(`${apiBaseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Paddle API error:', response.status, responseData);
      return res.status(response.status).json({
        error: 'Paddle API error',
        details: responseData,
        status: response.status
      });
    }

    console.log('✅ Paddle checkout session created:', responseData);

    // Return the checkout URL
    return res.status(200).json({
      success: true,
      checkoutUrl: responseData.data?.checkout?.url,
      transactionId: responseData.data?.id,
      data: responseData.data
    });

  } catch (error) {
    console.error('❌ Server error creating checkout:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}