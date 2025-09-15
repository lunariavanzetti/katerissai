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
    const paddleVendorId = process.env.VITE_PADDLE_VENDOR_ID;
    const paddleEnvironment = process.env.VITE_PADDLE_ENVIRONMENT || 'sandbox';

    console.log('🔍 Server-side Paddle configuration:');
    console.log('🔍 Vendor ID:', paddleVendorId);
    console.log('🔍 Environment:', paddleEnvironment);
    console.log('🔍 API Key present:', !!paddleApiKey);

    if (!paddleApiKey) {
      console.error('❌ Paddle API key not configured');
      return res.status(500).json({ error: 'Paddle API key not configured' });
    }

    // Determine API base URL
    const apiBaseUrl = paddleEnvironment === 'production' 
      ? 'https://api.paddle.com'
      : 'https://sandbox-api.paddle.com';

    // Create transaction request (temporarily without checkout URL to test basic functionality)
    const transactionData = {
      items: [{
        price_id: priceId,
        quantity: quantity
      }],
      customer: customerEmail ? {
        email: customerEmail
      } : undefined,
      custom_data: customData
      // Temporarily removing checkout URL due to domain approval issues
      // checkout: {
      //   url: `${process.env.VERCEL_URL || 'https://katerissai.vercel.app'}/dashboard?payment=success`
      // }
    };

    console.log('🔍 Domain issue detected - testing without custom checkout URL');
    console.log('🔍 Using API base URL:', apiBaseUrl);
    console.log('🔍 Price ID being used:', priceId);

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
    console.log('🔍 Full Paddle response:', JSON.stringify(responseData, null, 2));
    console.log('🔍 Checkout URL from Paddle:', responseData.data?.checkout?.url);

    const transactionId = responseData.data?.id;

    // Construct the proper Paddle hosted checkout URL
    const hostedCheckoutUrl = paddleEnvironment === 'production'
      ? `https://checkout.paddle.com/transactions/${transactionId}`
      : `https://sandbox-checkout.paddle.com/transactions/${transactionId}`;

    console.log('🔗 Constructed hosted checkout URL:', hostedCheckoutUrl);

    // Return the proper checkout URL
    return res.status(200).json({
      success: true,
      checkoutUrl: hostedCheckoutUrl,
      transactionId: transactionId,
      data: responseData.data,
      debug: {
        paddleProvidedUrl: responseData.data?.checkout?.url,
        constructedUrl: hostedCheckoutUrl,
        environment: paddleEnvironment
      }
    });

  } catch (error) {
    console.error('❌ Server error creating checkout:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}