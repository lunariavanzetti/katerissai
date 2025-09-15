// Payment Link Handler for Paddle _ptxn parameters
// Detects and processes Paddle payment links when users visit the site

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const PaymentLinkHandler: React.FC = () => {
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    console.log('🔍 PaymentLinkHandler: Location changed:', location.search);
    console.log('🔍 PaymentLinkHandler: Has redirected:', hasRedirected.current);

    // Prevent multiple redirects
    if (hasRedirected.current) {
      console.log('🔍 PaymentLinkHandler: Already redirected, skipping');
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const transactionId = urlParams.get('_ptxn');

    console.log('🔍 PaymentLinkHandler: Transaction ID from URL:', transactionId);

    // Only process if we have a valid transaction ID and haven't redirected yet
    if (transactionId && transactionId.startsWith('txn_')) {
      console.log('🔗 Paddle transaction ID detected:', transactionId);
      hasRedirected.current = true;

      // Determine environment from env vars
      const paddleEnvironment = import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox';
      console.log('🔍 PaymentLinkHandler: Paddle environment:', paddleEnvironment);

      // Based on Paddle's API v2 documentation, try different URL patterns
      const possibleUrls = paddleEnvironment === 'production'
        ? [
            `https://checkout.paddle.com/${transactionId}`,
            `https://checkout.paddle.com/checkout?_ptxn=${transactionId}`,
            `https://checkout.paddle.com/pay/${transactionId}`,
            `https://www.paddle.com/checkout/${transactionId}`
          ]
        : [
            `https://sandbox-checkout.paddle.com/${transactionId}`,
            `https://sandbox-checkout.paddle.com/checkout?_ptxn=${transactionId}`,
            `https://sandbox-checkout.paddle.com/pay/${transactionId}`,
            `https://sandbox.paddle.com/checkout/${transactionId}`
          ];

      const paddleCheckoutUrl = possibleUrls[0]; // Try the first one by default

      console.log('🚀 Redirecting to Paddle checkout:', paddleCheckoutUrl);

      // Show a loading message briefly before redirect with multiple URL options
      document.body.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
          z-index: 9999;
          padding: 20px;
          box-sizing: border-box;
        ">
          <div style="text-align: center; max-width: 600px;">
            <h2>Redirecting to Paddle Checkout...</h2>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p>Trying: <a href="${paddleCheckoutUrl}" target="_blank">${paddleCheckoutUrl}</a></p>
            <hr style="margin: 20px 0;">
            <p><strong>If the redirect doesn't work, try one of these links:</strong></p>
            ${possibleUrls.map((url, index) => `
              <p><a href="${url}" target="_blank" style="display: block; margin: 5px 0;">
                Option ${index + 1}: ${url}
              </a></p>
            `).join('')}
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              Note: The correct URL format depends on Paddle's current API version.
            </p>
          </div>
        </div>
      `;

      // Redirect immediately
      window.location.href = paddleCheckoutUrl;
    } else {
      console.log('🔍 PaymentLinkHandler: No valid transaction ID found or already processed');
    }
  }, [location]);

  // This component doesn't render anything when no redirect is needed
  return null;
};