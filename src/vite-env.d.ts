/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_PADDLE_VENDOR_ID: string
  readonly VITE_PADDLE_CLIENT_SIDE_TOKEN: string
  readonly VITE_PADDLE_ENVIRONMENT: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_SITE_URL?: string
  readonly VITE_PAY_PER_VIDEO_PRICE?: string
  readonly VITE_BASIC_MONTHLY_PRICE?: string
  readonly VITE_PREMIUM_MONTHLY_PRICE?: string
  readonly VITE_BASIC_VIDEO_LIMIT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}