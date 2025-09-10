# 🚀 Complete Paddle Setup Guide for Kateriss AI

## 📝 **Step 1: Business Verification - Product Description**

### **What will you be selling on Paddle?**

Copy and paste this into the Paddle verification form:

```
We are selling AI-powered video generation services through our SaaS platform "Kateriss AI Video Generator". 

Our platform provides three distinct service offerings:

1. **Pay-per-Video Service** ($2.49): One-time purchases allowing users to generate individual professional AI videos using Google's Veo 3 Fast technology. Perfect for users who need occasional video content or want to try our service.

2. **Basic Monthly Subscription** ($29/month): Recurring monthly access providing 20 AI video generations per month, including HD quality output, standard AI models, priority processing, email support, and personal video library management.

3. **Premium Monthly Subscription** ($149/month): Unlimited monthly AI video generation with advanced features including 4K output, access to all AI models, instant processing, priority support, commercial licensing rights, API access, advanced editing tools, and custom branding options.

Our service transforms text descriptions into professional-quality videos using cutting-edge artificial intelligence, serving content creators, marketing agencies, educators, small businesses, and enterprises who need high-quality video content efficiently and cost-effectively.

All services are delivered digitally through our secure web platform at https://katerissai.vercel.app with immediate access upon payment confirmation.
```

---

## 🎯 **Step 2: Product Setup in Paddle Dashboard**

### **Product 1: Pay-per-Video Generation**

**Product Fields:**
- **Product name:** `Kateriss AI - Pay-per-Video Generation`
- **Tax category:** `Standard digital goods`
- **Description:** `Generate one professional AI video using Google Veo 3 Fast technology. Transform your text prompt into a high-quality video instantly. Perfect for trying our service or creating individual videos on demand.`
- **Product icon URL:** `https://katerissai.vercel.app/icon-192x192.png`
- **Custom data:** 
  ```json
  {
    "tier": "pay-per-video",
    "video_limit": 1,
    "features": ["HD video generation", "Google Veo 3 Fast AI", "Instant processing", "Download rights"],
    "duration_limit": 30,
    "resolution": "1080p"
  }
  ```

**Price Configuration:**
- **Base price:** `2.49`
- **Currency:** `USD`
- **Tax:** `Account default (Inc. tax)`
- **Type:** `One-time`
- **Price name:** `Pay-per-Video - Single Generation`
- **Internal description:** `One-time payment for single AI video generation`
- **Product quantity limit:**
  - **Min:** `1`
  - **Max:** `10`

---

### **Product 2: Basic Monthly Subscription**

**Product Fields:**
- **Product name:** `Kateriss AI - Basic Monthly Plan`
- **Tax category:** `Standard digital goods`
- **Description:** `Monthly subscription providing 20 AI video generations per month. Includes HD quality, standard AI models, priority processing, email support, and personal video library. Perfect for content creators and small businesses with regular video needs.`
- **Product icon URL:** `https://katerissai.vercel.app/icon-192x192.png`
- **Custom data:**
  ```json
  {
    "tier": "basic",
    "video_limit": 20,
    "features": ["20 videos per month", "HD video generation", "Priority processing", "Email support", "Video library", "Download rights"],
    "duration_limit": 60,
    "resolution": "1080p"
  }
  ```

**Price Configuration:**
- **Base price:** `29.00`
- **Currency:** `USD`
- **Tax:** `Account default (Inc. tax)`
- **Type:** `Recurring`
- **Billing period:** `Monthly`
- **Trial period:** `7` Days
- **Price name:** `Basic Monthly - 20 Videos`
- **Internal description:** `Monthly subscription for basic tier with 20 video generations`
- **Product quantity limit:**
  - **Min:** `1`
  - **Max:** `1`

---

### **Product 3: Premium Monthly Subscription**

**Product Fields:**
- **Product name:** `Kateriss AI - Premium Monthly Plan`
- **Tax category:** `Standard digital goods`
- **Description:** `Premium monthly subscription with unlimited AI video generations. Includes 4K quality, all AI models, instant processing, priority support, commercial licensing, API access, advanced editing, and custom branding. Ideal for agencies and businesses.`
- **Product icon URL:** `https://katerissai.vercel.app/icon-192x192.png`
- **Custom data:**
  ```json
  {
    "tier": "premium",
    "video_limit": "unlimited",
    "features": ["Unlimited videos", "4K video generation", "All AI models", "Instant processing", "Priority support", "Commercial license", "API access", "Advanced editing", "Custom branding"],
    "duration_limit": "unlimited",
    "resolution": "4K"
  }
  ```

**Price Configuration:**
- **Base price:** `149.00`
- **Currency:** `USD`
- **Tax:** `Account default (Inc. tax)`
- **Type:** `Recurring`
- **Billing period:** `Monthly`
- **Trial period:** `14` Days
- **Price name:** `Premium Monthly - Unlimited Videos`
- **Internal description:** `Monthly subscription for premium tier with unlimited generations`
- **Product quantity limit:**
  - **Min:** `1`
  - **Max:** `1`

---

## 🌐 **Step 3: Domain Requirements Checklist**

### **Primary Domain to Submit:**
`https://katerissai.vercel.app`

### **Required Elements (Status):**

✅ **Already Complete:**
- [x] Clear product description (Homepage)
- [x] Pricing details (Pricing page)
- [x] Key features (Homepage + Pricing)
- [x] SSL certificate (HTTPS)
- [x] Live website
- [x] Professional design

❌ **Needs to be Added:**
- [ ] Terms & Conditions page
- [ ] Privacy Policy page
- [ ] Refund Policy page
- [ ] Footer navigation to legal pages
- [ ] Company name in Terms & Conditions

---

## 📋 **Step 4: After Product Creation**

### **Important: Save These IDs**

After creating each product and price in Paddle, save these IDs for integration:

```env
# Add these to your Vercel environment variables
VITE_PADDLE_PAY_PER_VIDEO_PRICE_ID=pri_xxxxx
VITE_PADDLE_BASIC_MONTHLY_PRICE_ID=pri_xxxxx  
VITE_PADDLE_PREMIUM_MONTHLY_PRICE_ID=pri_xxxxx
```

### **Webhook Configuration**
- **Webhook URL:** `https://katerissai.vercel.app/api/paddle/webhook`
- **Events:** subscription.created, subscription.updated, subscription.canceled, transaction.completed, transaction.payment_failed

---

## 🎯 **Step 5: Verification Process**

1. **Create all 3 products** with the exact details above
2. **Create prices** for each product with specified amounts
3. **Add legal pages** to website (I'll create these next)
4. **Submit domain** for verification
5. **Wait for approval** (usually 1-3 business days)
6. **Test in sandbox mode**
7. **Go live with real payments**

---

## 📞 **Business Information for Verification**

**Business Description:**
```
Kateriss AI operates a Software-as-a-Service (SaaS) platform specializing in artificial intelligence-powered video generation. Our platform enables users to create professional-quality videos from text descriptions using advanced machine learning models including Google's Veo 3 Fast technology.

We serve a diverse market including content creators, digital marketing agencies, educational institutions, small businesses, and enterprises who require high-quality video content for marketing, social media, training, and creative projects.

Our revenue model includes one-time purchases for individual video generations and monthly subscriptions for regular users, providing flexible options for different customer needs and usage patterns.
```

**Industry:** `Software/Technology - SaaS`
**Target Market:** `B2B and B2C - Digital content creation and marketing`

---

## ⚠️ **Important Notes**

1. **Test Mode First:** Always test in Paddle's sandbox environment before going live
2. **Legal Pages Required:** Domain won't be approved without Terms, Privacy, and Refund policies
3. **Product IDs:** Keep track of all product and price IDs for integration
4. **Webhook Testing:** Test webhook endpoints thoroughly
5. **Tax Compliance:** Ensure tax settings match your business requirements

---

## 🔧 **Next Steps**

1. ✅ Use this guide to create products in Paddle
2. ✅ I'll create the required legal pages
3. ✅ I'll fix the authentication issues you mentioned
4. ✅ I'll add the legal page navigation
5. ✅ Submit domain for Paddle verification