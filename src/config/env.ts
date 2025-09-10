// Legacy export for compatibility
export const env = import.meta.env;

export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL!,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
  },
  paddle: {
    vendorId: import.meta.env.VITE_PADDLE_VENDOR_ID!,
    clientSideToken: import.meta.env.VITE_PADDLE_CLIENT_SIDE_TOKEN!,
    environment: import.meta.env.VITE_PADDLE_ENVIRONMENT! as 'sandbox' | 'production',
  },
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY!,
  },
  app: {
    name: 'Kateriss AI Video Generator',
    url: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
    version: '1.0.0',
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

requiredEnvVars.forEach(envVar => {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});