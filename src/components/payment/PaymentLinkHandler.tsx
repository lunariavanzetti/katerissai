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

      // Construct proper Paddle checkout URL
      const paddleCheckoutUrl = paddleEnvironment === 'production'
        ? `https://checkout.paddle.com/checkout?_ptxn=${transactionId}`
        : `https://sandbox-checkout.paddle.com/checkout?_ptxn=${transactionId}`;

      console.log('🚀 Redirecting to Paddle checkout:', paddleCheckoutUrl);

      // Show a loading message briefly before redirect
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
        ">
          <div style="text-align: center;">
            <h2>Redirecting to Paddle Checkout...</h2>
            <p>Transaction ID: ${transactionId}</p>
            <p>If you are not redirected automatically, <a href="${paddleCheckoutUrl}">click here</a></p>
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