// Legacy export for compatibility  
export const env = import.meta.env;

// Database connection status
console.log('🗄️ Database configured:', !!import.meta.env.VITE_SUPABASE_URL);

// COMPREHENSIVE API KEY DEBUGGING
console.log('🔍 === COMPLETE PADDLE CONFIGURATION DEBUG ===');
console.log('🔑 VENDOR ID:', import.meta.env.VITE_PADDLE_VENDOR_ID);
console.log('🔑 CLIENT-SIDE TOKEN:', import.meta.env.VITE_PADDLE_CLIENT_SIDE_TOKEN);
console.log('🔑 API KEY:', import.meta.env.VITE_PADDLE_API_KEY);
console.log('🔑 ENVIRONMENT:', import.meta.env.VITE_PADDLE_ENVIRONMENT);
console.log('🔑 PAY PER VIDEO PRICE ID:', import.meta.env.VITE_PADDLE_PAY_PER_VIDEO_PRICE_ID);
console.log('🔑 BASIC MONTHLY PRICE ID:', import.meta.env.VITE_PADDLE_BASIC_MONTHLY_PRICE_ID);
console.log('🔑 PREMIUM MONTHLY PRICE ID:', import.meta.env.VITE_PADDLE_PREMIUM_MONTHLY_PRICE_ID);
console.log('🌍 CURRENT DOMAIN:', window.location.origin);
console.log('🔍 === END PADDLE DEBUG ===');

export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  paddle: {
    vendorId: import.meta.env.VITE_PADDLE_VENDOR_ID || '',
    clientSideToken: import.meta.env.VITE_PADDLE_CLIENT_SIDE_TOKEN || '',
    apiKey: import.meta.env.VITE_PADDLE_API_KEY || '',
    environment: (import.meta.env.VITE_PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
    priceIds: {
      payPerVideo: import.meta.env.VITE_PADDLE_PAY_PER_VIDEO_PRICE_ID || '',
      basicMonthly: import.meta.env.VITE_PADDLE_BASIC_MONTHLY_PRICE_ID || '',
      premiumMonthly: import.meta.env.VITE_PADDLE_PREMIUM_MONTHLY_PRICE_ID || '',
    },
  },
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  },
  app: {
    name: 'Kateriss AI Video Generator',
    url: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
    version: '1.0.0',
  },
  auth: {
    maxLoginAttempts: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDurationMinutes: parseInt(import.meta.env.VITE_LOCKOUT_DURATION_MINUTES) || 15,
    passwordMinLength: parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH) || 8,
    redirectUrl: import.meta.env.VITE_AUTH_REDIRECT_URL || 'http://localhost:5173/auth/callback',
  },
  pricing: {
    payPerVideo: parseFloat(import.meta.env.VITE_PAY_PER_VIDEO_PRICE) || 2.49,
    basicMonthly: parseFloat(import.meta.env.VITE_BASIC_MONTHLY_PRICE) || 29,
    premiumMonthly: parseFloat(import.meta.env.VITE_PREMIUM_MONTHLY_PRICE) || 149,
    basicVideoLimit: parseInt(import.meta.env.VITE_BASIC_VIDEO_LIMIT) || 20,
  }
};

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY', 
  'VITE_PADDLE_VENDOR_ID',
  'VITE_PADDLE_CLIENT_SIDE_TOKEN',
  'VITE_PADDLE_ENVIRONMENT',
  'VITE_GEMINI_API_KEY'
];

// Check for missing environment variables and log warnings instead of throwing errors
const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(
    '⚠️ Missing environment variables:\n' +
    missingEnvVars.map(envVar => `  - ${envVar}`).join('\n') +
    '\n\nSome features may not work properly. Please configure these in your deployment settings.'
  );
}