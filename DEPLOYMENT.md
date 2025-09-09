# Deployment Guide

This guide provides comprehensive instructions for deploying the Kateriss AI Video Generator to production. Follow these steps carefully to ensure a smooth deployment process.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Paddle Integration](#paddle-integration)
4. [Google Veo AI Configuration](#google-veo-ai-configuration)
5. [Vercel Deployment](#vercel-deployment)
6. [GitHub Actions Configuration](#github-actions-configuration)
7. [Domain & DNS Setup](#domain--dns-setup)
8. [SSL Certificate](#ssl-certificate)
9. [Environment Variables](#environment-variables)
10. [Database Setup](#database-setup)
11. [Performance Optimization](#performance-optimization)
12. [Monitoring & Analytics](#monitoring--analytics)
13. [Security Configuration](#security-configuration)
14. [Backup & Recovery](#backup--recovery)
15. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting the deployment process, ensure you have:

- [x] Node.js 18.x or higher installed
- [x] npm or yarn package manager
- [x] Git version control
- [x] Supabase account
- [x] Paddle account (for payments)
- [x] Google Cloud Platform account (for Veo AI)
- [x] Vercel account
- [x] GitHub repository
- [x] Domain name (optional but recommended)

## Supabase Setup

### 1. Create New Project

1. **Sign up/Login to Supabase**
   - Visit [supabase.com](https://supabase.com)
   - Create account or sign in
   - Click "New Project"

2. **Configure Project Settings**
   ```
   Project Name: kateriss-ai-production
   Database Password: [Generate strong password]
   Region: [Choose closest to your users]
   Pricing Plan: Pro (recommended for production)
   ```

3. **Save Project Credentials**
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   Project API Key (anon): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Project API Key (service_role): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2. Database Schema Setup

1. **Apply Migrations**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link to your project
   supabase link --project-ref YOUR_PROJECT_ID

   # Apply migrations
   supabase db push
   ```

2. **Enable Row Level Security (RLS)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
   ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
   -- Add policies as defined in schema
   ```

3. **Create Storage Buckets**
   ```sql
   -- Create videos storage bucket
   INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
   VALUES (
     'videos', 
     'videos', 
     true, 
     ARRAY['video/mp4', 'video/webm', 'video/quicktime']
   );

   -- Create thumbnails storage bucket
   INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
   VALUES (
     'thumbnails', 
     'thumbnails', 
     true, 
     ARRAY['image/jpeg', 'image/png', 'image/webp']
   );
   ```

### 3. Edge Functions Deployment

1. **Deploy Processing Functions**
   ```bash
   # Deploy video processing function
   supabase functions deploy process-video-generation

   # Deploy webhook handler
   supabase functions deploy handle-paddle-webhook

   # Deploy usage limit checker
   supabase functions deploy usage-limit-check

   # Deploy cleanup function
   supabase functions deploy cleanup-expired-videos

   # Deploy welcome email function
   supabase functions deploy send-welcome-email
   ```

2. **Set Function Environment Variables**
   ```bash
   supabase secrets set VEO_API_KEY=your_veo_api_key
   supabase secrets set VEO_ENDPOINT=https://api.veo.google.com/v1
   supabase secrets set PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret
   supabase secrets set SENDGRID_API_KEY=your_sendgrid_key
   ```

### 4. Database Optimization

1. **Create Indexes**
   ```sql
   -- Performance indexes
   CREATE INDEX idx_videos_user_id_status ON videos(user_id, status);
   CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
   CREATE INDEX idx_usage_user_id_period ON usage(user_id, period_start, period_end);
   CREATE INDEX idx_payments_user_id_created ON payments(user_id, created_at DESC);
   CREATE INDEX idx_subscriptions_status_user ON subscriptions(status, user_id);
   ```

2. **Configure Connection Pooling**
   - Navigate to Settings → Database
   - Enable Connection Pooling
   - Set Pool Mode to "Transaction"
   - Set Default Pool Size to 15
   - Set Max Client Connections to 100

## Paddle Integration

### 1. Account Setup

1. **Create Paddle Account**
   - Visit [paddle.com](https://paddle.com)
   - Complete business verification
   - Set up tax and VAT information
   - Configure payout methods

2. **Create Products**
   
   **Pay-per-Video Product:**
   ```
   Name: Single Video Generation
   Type: One-time purchase
   Price: $2.49 USD
   Product ID: [Save this value]
   ```

   **Basic Subscription:**
   ```
   Name: Basic Monthly Plan
   Type: Recurring subscription
   Price: $29.00 USD/month
   Billing Cycle: Monthly
   Trial Period: 7 days (optional)
   Product ID: [Save this value]
   ```

   **Premium Subscription:**
   ```
   Name: Premium Monthly Plan
   Type: Recurring subscription
   Price: $149.00 USD/month
   Billing Cycle: Monthly
   Trial Period: 7 days (optional)
   Product ID: [Save this value]
   ```

### 2. Webhook Configuration

1. **Set Up Webhook Endpoint**
   ```
   Webhook URL: https://your-domain.com/api/webhooks/paddle
   Events to Subscribe:
   - subscription_created
   - subscription_updated
   - subscription_cancelled
   - payment_succeeded
   - payment_failed
   - subscription_payment_succeeded
   - subscription_payment_failed
   ```

2. **Configure Webhook Security**
   - Enable webhook signature verification
   - Save the webhook secret key
   - Test webhook delivery

### 3. Client-Side Configuration

1. **Paddle.js Setup**
   ```javascript
   // Configure in your application
   const paddle = {
     environment: 'production', // or 'sandbox' for testing
     clientSideToken: 'live_xxxxxxxxxxxxx',
     pwCustomer: {
       email: user.email
     }
   };
   ```

## Google Veo AI Configuration

### 1. Google Cloud Project Setup

1. **Create GCP Project**
   ```bash
   # Install Google Cloud CLI
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL

   # Login and create project
   gcloud auth login
   gcloud projects create kateriss-ai-prod
   gcloud config set project kateriss-ai-prod
   ```

2. **Enable Required APIs**
   ```bash
   # Enable Veo AI API (when available)
   gcloud services enable veo.googleapis.com
   
   # Enable Gemini API (current implementation)
   gcloud services enable generativelanguage.googleapis.com
   ```

3. **Create Service Account**
   ```bash
   # Create service account
   gcloud iam service-accounts create veo-ai-service \
     --display-name="Veo AI Service Account"

   # Create and download key
   gcloud iam service-accounts keys create ~/veo-ai-key.json \
     --iam-account=veo-ai-service@kateriss-ai-prod.iam.gserviceaccount.com

   # Grant necessary permissions
   gcloud projects add-iam-policy-binding kateriss-ai-prod \
     --member="serviceAccount:veo-ai-service@kateriss-ai-prod.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```

### 2. API Configuration

1. **Generate API Key**
   - Visit Google Cloud Console
   - Navigate to APIs & Services → Credentials
   - Create new API Key
   - Restrict API key to specific APIs
   - Save the API key securely

2. **Set Up Quotas**
   - Navigate to APIs & Services → Quotas
   - Configure appropriate limits for Veo AI usage
   - Set up billing alerts

## Vercel Deployment

### 1. Project Setup

1. **Connect GitHub Repository**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login to Vercel
   vercel login

   # Import project
   vercel import git
   ```

2. **Configure Build Settings**
   ```json
   {
     "buildCommand": "npm run build",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "outputDirectory": "dist"
   }
   ```

### 2. Environment Variables Setup

1. **Navigate to Vercel Dashboard**
   - Go to your project settings
   - Click on "Environment Variables"
   - Add all required variables:

   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_PADDLE_VENDOR_ID=12345
   VITE_PADDLE_CLIENT_SIDE_TOKEN=live_xxxxxxxxxxxxx
   VITE_PADDLE_ENVIRONMENT=production
   VITE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxx
   VITE_SITE_URL=https://your-domain.com
   ```

### 3. Domain Configuration

1. **Custom Domain Setup**
   ```bash
   # Add custom domain
   vercel domains add your-domain.com
   vercel domains add www.your-domain.com

   # Configure DNS records
   # A Record: your-domain.com -> 76.76.21.21
   # CNAME: www.your-domain.com -> cname.vercel-dns.com
   ```

2. **SSL Certificate**
   - Vercel automatically provisions SSL certificates
   - Verify HTTPS is working correctly
   - Set up automatic renewal

## GitHub Actions Configuration

### 1. Repository Secrets

Add the following secrets to your GitHub repository:

```
Settings → Secrets and variables → Actions → New repository secret
```

**Required Secrets:**
```
VERCEL_TOKEN=xxxxxxxxxxxxx
VERCEL_ORG_ID=team_xxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_PADDLE_VENDOR_ID=12345
VITE_PADDLE_CLIENT_SIDE_TOKEN=live_xxxxxxxxxxxxx
VITE_PADDLE_ENVIRONMENT=production
VITE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxx
VITE_SITE_URL=https://your-domain.com
```

### 2. Workflow Configuration

The `.github/workflows/deploy.yml` file is already configured with:
- Automated linting and type checking
- Preview deployments for pull requests
- Production deployments on main branch merges
- Build artifact caching for faster deployments

## Domain & DNS Setup

### 1. DNS Configuration

**For Cloudflare (Recommended):**
```
Type    Name    Content                     TTL     Proxy
A       @       76.76.21.21                Auto    Proxied
CNAME   www     cname.vercel-dns.com       Auto    Proxied
```

**For Other DNS Providers:**
```
A       your-domain.com         76.76.21.21
CNAME   www.your-domain.com     cname.vercel-dns.com
```

### 2. DNS Verification

```bash
# Verify DNS propagation
dig your-domain.com
nslookup your-domain.com

# Test HTTPS
curl -I https://your-domain.com
```

## SSL Certificate

### 1. Automatic SSL (Vercel)

Vercel automatically provides SSL certificates via Let's Encrypt:
- Certificates auto-renew every 60 days
- Support for custom domains
- HTTP to HTTPS redirects enabled by default

### 2. Certificate Verification

```bash
# Check certificate details
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Verify certificate expiry
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | \
openssl x509 -noout -dates
```

## Performance Optimization

### 1. Vercel Configuration

**vercel.json optimizations:**
```json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### 2. Build Optimizations

**Vite configuration optimizations:**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@headlessui/react', 'framer-motion'],
          'vendor-data': ['@tanstack/react-query', 'axios']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### 3. Image Optimization

```javascript
// Optimized image loading
const optimizedImageUrl = (url: string, width: number) => {
  return `${url}?w=${width}&f=webp&q=80`;
};
```

## Monitoring & Analytics

### 1. Vercel Analytics

1. **Enable Vercel Analytics**
   ```bash
   # Install Vercel Analytics
   npm install @vercel/analytics

   # Add to app
   import { Analytics } from '@vercel/analytics/react';
   ```

2. **Configure Speed Insights**
   ```bash
   npm install @vercel/speed-insights
   ```

### 2. Supabase Monitoring

1. **Database Monitoring**
   - Monitor connection pool usage
   - Track query performance
   - Set up alerts for high usage

2. **Edge Function Monitoring**
   - Monitor function execution times
   - Track error rates
   - Set up log aggregation

### 3. Application Monitoring

**Error Tracking (Recommended: Sentry):**
```bash
npm install @sentry/react @sentry/tracing

# Configure in main.tsx
Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 0.1
});
```

## Security Configuration

### 1. Environment Security

- Never commit sensitive keys to version control
- Use Vercel's encrypted environment variables
- Rotate API keys regularly
- Enable 2FA on all accounts

### 2. Application Security

**Content Security Policy:**
```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' *.paddle.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' *.supabase.co *.paddle.com;"
        }
      ]
    }
  ]
}
```

### 3. Database Security

- Enable Row Level Security (RLS)
- Use service role keys only in Edge Functions
- Regular security audits
- Monitor for suspicious activity

## Backup & Recovery

### 1. Database Backups

**Automatic Backups (Supabase Pro):**
- Daily automatic backups
- Point-in-time recovery
- Cross-region backup replication

**Manual Backup:**
```bash
# Create manual backup
supabase db dump --data-only > backup-$(date +%Y%m%d).sql

# Restore from backup
supabase db reset --file backup-YYYYMMDD.sql
```

### 2. File Storage Backups

```bash
# Backup Supabase Storage
supabase storage cp --recursive supabase://videos ./backups/videos/
supabase storage cp --recursive supabase://thumbnails ./backups/thumbnails/
```

## Troubleshooting

### Common Deployment Issues

**1. Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Verify environment variables
echo $VITE_SUPABASE_URL
```

**2. Database Connection Issues**
- Verify Supabase URL and keys
- Check connection pool limits
- Review RLS policies

**3. Payment Integration Issues**
- Verify Paddle credentials
- Check webhook endpoint accessibility
- Review webhook payload formats

**4. Video Generation Issues**
- Verify Google Cloud API access
- Check API quotas and limits
- Review Edge Function logs

### Health Checks

**Application Health Check:**
```bash
# Test main endpoints
curl -f https://your-domain.com/health || exit 1

# Test API endpoints
curl -f https://your-domain.com/api/health || exit 1
```

**Database Health Check:**
```sql
-- Check database connectivity
SELECT version();

-- Check table health
SELECT schemaname, tablename, n_live_tup 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;
```

### Performance Monitoring

**Key Metrics to Monitor:**
- Page load times
- Database query performance
- Edge Function execution times
- Error rates
- User engagement metrics

**Alerts to Set Up:**
- High error rates (>5%)
- Slow page loads (>3 seconds)
- Database connection pool exhaustion
- High Edge Function execution times
- Payment processing failures

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied successfully
- [ ] Edge Functions deployed and working
- [ ] Payment integration tested
- [ ] Video generation workflow tested
- [ ] SSL certificate active and valid
- [ ] Custom domain working correctly
- [ ] Monitoring and alerting configured
- [ ] Backup procedures verified
- [ ] Performance optimizations applied
- [ ] Security measures implemented
- [ ] Documentation updated

## Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review error logs and monitoring alerts
- Check system performance metrics
- Verify backup integrity

**Monthly:**
- Update dependencies
- Review and rotate API keys
- Analyze user feedback and performance

**Quarterly:**
- Security audit and penetration testing
- Disaster recovery testing
- Performance optimization review

---

**For additional support, refer to:**
- [Development Guide](./DEVELOPMENT.md)
- [API Documentation](./API.md)
- [Database Schema](./DATABASE.md)
- Supabase Documentation
- Vercel Documentation
- Paddle Developer Documentation