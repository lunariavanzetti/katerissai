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

    // Create transaction request without checkout URL (domain approval still pending)
    const transactionData = {
      items: [{
        price_id: priceId,
        quantity: quantity
      }],
      customer: customerEmail ? {
        email: customerEmail
      } : undefined,
      custom_data: customData
      // Domain still not approved - removing checkout URL for now
      // checkout: {
      //   url: `${process.env.VERCEL_URL || 'https://katerissai.vercel.app'}/dashboard?payment=success`
      // }
    };

    console.log('🔍 Domain approval still pending - creating transaction without checkout URL');
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

    // Since transaction is created without checkout URL, we need to get it differently
    // Try to get the checkout URL from Paddle's transaction endpoint
    let finalCheckoutUrl = null;

    try {
      console.log('🔍 Attempting to get checkout URL from transaction API...');
      const transactionResponse = await fetch(`${apiBaseUrl}/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paddleApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (transactionResponse.ok) {
        const transactionData = await transactionResponse.json();
        console.log('🔍 Transaction details:', JSON.stringify(transactionData, null, 2));
        finalCheckoutUrl = transactionData.data?.checkout?.url;
      }
    } catch (error) {
      console.log('🔍 Could not fetch transaction details:', error.message);
    }

    // Fallback: Use the payment link that we know works in the PaymentLinkHandler
    const paymentLinkUrl = `${process.env.VERCEL_URL || 'https://katerissai.vercel.app'}?_ptxn=${transactionId}`;

    if (!finalCheckoutUrl) {
      finalCheckoutUrl = paymentLinkUrl;
      console.log('🔗 Using payment link as checkout URL:', finalCheckoutUrl);
    } else {
      console.log('🔗 Got checkout URL from Paddle:', finalCheckoutUrl);
    }

    // Return the proper checkout URL
    return res.status(200).json({
      success: true,
      checkoutUrl: finalCheckoutUrl,
      transactionId: transactionId,
      data: responseData.data,
      debug: {
        paymentLinkUrl: paymentLinkUrl,
        finalUrl: finalCheckoutUrl,
        environment: paddleEnvironment,
        note: 'Use the paymentLinkUrl which redirects to proper Paddle checkout'
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