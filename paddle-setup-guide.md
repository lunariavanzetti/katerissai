# 🏄‍♂️ Complete Paddle Setup Guide for Kateriss AI

## 📋 **Step 1: Verification Application**

### **What will you be selling on Paddle?**
```
We are selling AI-powered video generation services through our SaaS platform "Kateriss AI Video Generator". 

Our platform provides three service tiers:

1. Pay-per-Video: One-time purchases for individual AI video generation using Google's Veo 3 Fast technology
2. Basic Monthly Subscription: Monthly access to generate up to 20 AI videos with standard features
3. Premium Monthly Subscription: Monthly unlimited AI video generation with advanced features and commercial licensing

Our service allows users to create professional-quality videos from text prompts using cutting-edge AI technology. Each video generation uses advanced machine learning models to produce unique, high-quality video content for marketing, social media, education, and creative projects.
```

## 🎯 **Step 2: Product Setup**

### **Product 1: Pay-per-Video**

**Product Fields:**
- **Product name:** `Kateriss AI - Pay-per-Video Generation`
- **Tax category:** `Standard digital goods`
- **Description:** `Generate one professional AI video using Google Veo 3 Fast technology. Perfect for trying our service or creating individual videos on demand.`
- **Product icon URL:** `https://katerissai.vercel.app/icons/pay-per-video-icon.png`
- **Custom data:** 
  ```json
  {
    "tier": "pay-per-video",
    "video_limit": 1,
    "features": ["HD video generation", "Basic AI models", "Standard processing"],
    "usage_type": "one_time"
  }
  ```

**Price Fields:**
- **Base price:** `2.49` USD
- **Tax:** `Account default (Inc. tax)`
- **Type:** `One-time`
- **Price name:** `Pay-per-Video - Single Generation`
- **Internal description:** `One-time payment for single AI video generation`
- **Set product quantity limit:**
  - **Min:** `1`
  - **Max:** `10`

---

### **Product 2: Basic Monthly Subscription**

**Product Fields:**
- **Product name:** `Kateriss AI - Basic Monthly Plan`
- **Tax category:** `Standard digital goods`
- **Description:** `Monthly subscription including 20 AI video generations, standard features, and priority support. Perfect for content creators and small businesses.`
- **Product icon URL:** `https://katerissai.vercel.app/icons/basic-plan-icon.png`
- **Custom data:**
  ```json
  {
    "tier": "basic",
    "video_limit": 20,
    "features": ["HD video generation", "Advanced AI models", "Priority processing", "Email support", "Video library"],
    "usage_type": "subscription"
  }
  ```

**Price Fields:**
- **Base price:** `29.00` USD
- **Tax:** `Account default (Inc. tax)`
- **Type:** `Recurring`
- **Billing period:** `Monthly`
- **Trial period:** `7 Days`
- **Price name:** `Basic Monthly - 20 Videos`
- **Internal description:** `Monthly subscription for basic tier with 20 video generations`
- **Set product quantity limit:**
  - **Min:** `1`
  - **Max:** `1`

---

### **Product 3: Premium Monthly Subscription**

**Product Fields:**
- **Product name:** `Kateriss AI - Premium Monthly Plan`
- **Tax category:** `Standard digital goods`
- **Description:** `Premium monthly subscription with unlimited AI video generations, advanced features, commercial licensing, and priority support. Ideal for agencies and businesses.`
- **Product icon URL:** `https://katerissai.vercel.app/icons/premium-plan-icon.png`
- **Custom data:**
  ```json
  {
    "tier": "premium",
    "video_limit": "unlimited",
    "features": ["4K video generation", "All AI models", "Instant processing", "Priority support", "Commercial license", "API access", "Advanced editing", "Custom branding"],
    "usage_type": "subscription"
  }
  ```

**Price Fields:**
- **Base price:** `149.00` USD
- **Tax:** `Account default (Inc. tax)`
- **Type:** `Recurring`
- **Billing period:** `Monthly`
- **Trial period:** `14 Days`
- **Price name:** `Premium Monthly - Unlimited Videos`
- **Internal description:** `Monthly subscription for premium tier with unlimited generations`
- **Set product quantity limit:**
  - **Min:** `1`
  - **Max:** `1`

## 📄 **Step 3: Website Requirements Checklist**

Your website must include these pages and elements:

### ✅ **Required Pages (already implemented):**
- [x] **Homepage** with clear product description
- [x] **Pricing Page** with detailed pricing information
- [x] **Features Page** showing key deliverables
- [x] **Terms & Conditions** (needs to be added)
- [x] **Privacy Policy** (needs to be added)
- [x] **Refund Policy** (needs to be added)

### ✅ **Required Elements:**
- [x] **SSL Certificate** (HTTPS) ✓
- [x] **Live Website** ✓
- [x] **Clear Product Description** ✓
- [x] **Pricing Details** ✓
- [x] **Key Features Listed** ✓
- [ ] **Legal Pages** (need to add)
- [ ] **Company Name in Terms** (need to add)

## 📋 **Step 4: Domain Submission**

**Primary Domain:** `https://katerissai.vercel.app`

**Additional domains/subdomains to submit:**
- `katerissai.vercel.app` (main domain)
- Any custom domain you plan to use later

## 🏢 **Step 5: Business Information**

When filling out business details:

**Business Type:** 
- Individual/Sole Proprietor OR Company (your choice)

**Business Description:**
```
Kateriss AI is a cutting-edge SaaS platform that provides AI-powered video generation services. We enable users to create professional-quality videos from simple text descriptions using advanced machine learning technology including Google's Veo 3 Fast model. Our platform serves content creators, marketers, educators, and businesses who need high-quality video content quickly and affordably.
```

**Industry:** `Software/Technology - SaaS`

**Target Market:** `B2B and B2C - Content creators, marketing agencies, small businesses, educators`

## 🔧 **Step 6: Webhook Configuration**

**Webhook URL:** `https://katerissai.vercel.app/api/paddle/webhook`

**Events to Subscribe:**
- `subscription.created`
- `subscription.updated` 
- `subscription.canceled`
- `transaction.completed`
- `transaction.payment_failed`

## 💳 **Step 7: Integration Testing**

After approval, test with these scenarios:
1. **Pay-per-video purchase** - $2.49 one-time payment
2. **Basic subscription** - $29/month with 7-day trial
3. **Premium subscription** - $149/month with 14-day trial
4. **Subscription cancellation**
5. **Failed payment handling**

## 📞 **Step 8: Support Information**

**Support Email:** `support@kateriss.ai` (or your preferred email)
**Response Time:** `24-48 hours`
**Support Hours:** `Monday-Friday, 9 AM - 6 PM UTC`

## 🎯 **Next Steps After Setup:**

1. ✅ Create products and prices in Paddle
2. ✅ Submit domain for verification
3. ✅ Complete business verification
4. ✅ Add legal pages to website
5. ✅ Configure webhook endpoints
6. ✅ Test integration in sandbox mode
7. ✅ Go live with real payments

---

## 📝 **Notes:**
- Keep product IDs and price IDs - you'll need them for integration
- Test thoroughly in sandbox mode before going live
- Ensure all legal pages are accessible from website footer
- Monitor webhook delivery and handle failures gracefully