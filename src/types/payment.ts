// Payment and Subscription Type Definitions for Kateriss AI Video Generator
// Paddle Integration with Comprehensive Billing Support

// =============================================================================
// PADDLE INTEGRATION TYPES
// =============================================================================

export interface PaddleEnvironment {
  environment: 'sandbox' | 'production';
  vendorId: string;
  clientSideToken: string;
}

export interface PaddleCheckoutSettings {
  method?: 'inline' | 'overlay';
  successUrl?: string;
  closeUrl?: string;
  loadCallback?: () => void;
  successCallback?: (data: PaddleCheckoutSuccess) => void;
  closeCallback?: () => void;
}

export interface PaddleCheckoutSuccess {
  checkout: {
    id: string;
    completed: boolean;
  };
  order: {
    id: string;
    total: string;
    currency: string;
    formatted_total: string;
  };
  user: {
    id: string;
    email: string;
    country: string;
  };
}

export interface PaddleProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  recurring?: boolean;
  interval?: 'month' | 'year';
  trial_days?: number;
}

// =============================================================================
// PRICING TIERS
// =============================================================================

export type PricingTier = 'pay-per-video' | 'basic' | 'premium';

export interface PricingPlan {
  id: string;
  tier: PricingTier;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval?: 'month' | 'year' | 'one-time';
  paddleProductId?: string;
  features: string[];
  videoLimit?: number; // null for unlimited
  commercialRights: boolean;
  priority: number; // For sorting/highlighting
  popular?: boolean;
  highlighted?: boolean;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary' | 'outline';
}

export interface PricingFeature {
  id: string;
  name: string;
  description?: string;
  included: Record<PricingTier, boolean | string>;
  tooltip?: string;
}

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

export interface Subscription {
  id: string;
  userId: string;
  paddleSubscriptionId: string;
  status: SubscriptionStatus;
  plan: PricingTier;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export type SubscriptionStatus = 
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export interface SubscriptionChange {
  id: string;
  subscriptionId: string;
  fromPlan: PricingTier;
  toPlan: PricingTier;
  effectiveDate: Date;
  prorationAmount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

// =============================================================================
// PAYMENT TYPES
// =============================================================================

export interface Payment {
  id: string;
  userId: string;
  paddleOrderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  description: string;
  subscriptionId?: string;
  videoCount?: number; // For pay-per-video payments
  createdAt: Date;
  paidAt?: Date;
  refundedAt?: Date;
  metadata?: Record<string, any>;
}

export type PaymentStatus = 
  | 'pending'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'partially_refunded';

export type PaymentType = 
  | 'subscription'
  | 'one-time'
  | 'upgrade'
  | 'downgrade'
  | 'refund';

export interface PaymentMethod {
  id: string;
  userId: string;
  paddlePaymentMethodId: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

// =============================================================================
// BILLING TYPES
// =============================================================================

export interface Invoice {
  id: string;
  userId: string;
  paddleInvoiceId: string;
  subscriptionId?: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  taxAmount: number;
  total: number;
  description: string;
  lineItems: InvoiceLineItem[];
  issuedAt: Date;
  dueAt: Date;
  paidAt?: Date;
  downloadUrl?: string;
  createdAt: Date;
}

export type InvoiceStatus = 
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  currency: string;
  period?: {
    start: Date;
    end: Date;
  };
}

// =============================================================================
// USAGE TRACKING TYPES
// =============================================================================

export interface UsageData {
  userId: string;
  subscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  videosGenerated: number;
  videoLimit: number | null; // null for unlimited
  remainingVideos: number | null; // null for unlimited
  usagePercentage: number;
  resetDate: Date;
  overageCount: number;
  overageCharges: number;
  lastVideoAt?: Date;
}

export interface UsageEvent {
  id: string;
  userId: string;
  type: UsageEventType;
  count: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type UsageEventType = 
  | 'video_generated'
  | 'subscription_reset'
  | 'upgrade'
  | 'downgrade';

// =============================================================================
// WEBHOOK TYPES
// =============================================================================

export interface PaddleWebhookEvent {
  alert_id: string;
  alert_name: string;
  cancel_url: string;
  checkout_id: string;
  currency: string;
  customer_name: string;
  email: string;
  event_time: string;
  marketing_consent: string;
  next_bill_date?: string;
  order_id: string;
  passthrough?: string;
  quantity: string;
  receipt_url: string;
  status: string;
  subscription_id?: string;
  subscription_plan_id?: string;
  unit_price: string;
  user_id: string;
  p_signature: string;
}

export type WebhookEventType = 
  | 'subscription_created'
  | 'subscription_updated' 
  | 'subscription_cancelled'
  | 'subscription_payment_succeeded'
  | 'subscription_payment_failed'
  | 'subscription_payment_refunded'
  | 'payment_succeeded'
  | 'payment_refunded';

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

export interface PricingCardProps {
  plan: PricingPlan;
  currentPlan?: PricingTier;
  onSelect: (plan: PricingPlan) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface CheckoutFormProps {
  plan: PricingPlan;
  onSuccess: (data: PaddleCheckoutSuccess) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  customAmount?: number; // For pay-per-video
  videoCount?: number; // For pay-per-video
  className?: string;
}

export interface BillingPortalProps {
  subscription?: Subscription;
  onSubscriptionChange?: (subscription: Subscription) => void;
  onError?: (error: string) => void;
  className?: string;
}

export interface PaymentHistoryProps {
  payments: Payment[];
  loading?: boolean;
  onRefund?: (paymentId: string) => void;
  onDownloadInvoice?: (invoiceId: string) => void;
  className?: string;
}

export interface UsageTrackerProps {
  usage: UsageData;
  showDetails?: boolean;
  onUpgrade?: () => void;
  className?: string;
}

export interface PlanComparisonProps {
  plans: PricingPlan[];
  features: PricingFeature[];
  currentPlan?: PricingTier;
  onPlanSelect: (plan: PricingPlan) => void;
  className?: string;
}

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: PricingTier;
  targetPlan?: PricingTier;
  onUpgrade: (plan: PricingPlan) => void;
  onError?: (error: string) => void;
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

export interface UseSubscriptionReturn {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  actions: {
    createSubscription: (planId: string) => Promise<Subscription>;
    updateSubscription: (planId: string) => Promise<Subscription>;
    cancelSubscription: (immediately?: boolean) => Promise<void>;
    reactivateSubscription: () => Promise<Subscription>;
    refreshSubscription: () => Promise<Subscription | null>;
  };
}

export interface UsePaymentReturn {
  loading: boolean;
  error: string | null;
  actions: {
    initiateCheckout: (plan: PricingPlan, options?: PaddleCheckoutSettings) => Promise<void>;
    processOneTimePayment: (amount: number, description: string) => Promise<Payment>;
    refundPayment: (paymentId: string, amount?: number) => Promise<Payment>;
    getPaymentHistory: () => Promise<Payment[]>;
  };
}

export interface UseUsageReturn {
  usage: UsageData | null;
  loading: boolean;
  error: string | null;
  actions: {
    recordUsage: (type: UsageEventType, count?: number) => Promise<void>;
    getUsageHistory: () => Promise<UsageEvent[]>;
    checkLimit: () => Promise<boolean>;
    refreshUsage: () => Promise<UsageData | null>;
  };
}

export interface UseBillingReturn {
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  actions: {
    getInvoices: () => Promise<Invoice[]>;
    downloadInvoice: (invoiceId: string) => Promise<string>;
    addPaymentMethod: (paddleMethodId: string) => Promise<PaymentMethod>;
    removePaymentMethod: (methodId: string) => Promise<void>;
    setDefaultPaymentMethod: (methodId: string) => Promise<void>;
    retryFailedPayment: (invoiceId: string) => Promise<void>;
  };
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface PaddleApiResponse<T = any> {
  success: boolean;
  response?: T;
  error?: {
    code: number;
    message: string;
    details?: any;
  };
}

export interface SubscriptionApiResponse {
  subscription_id: string;
  plan_id: string;
  user_id: string;
  status: string;
  next_payment: {
    amount: string;
    currency: string;
    date: string;
  };
  last_payment: {
    amount: string;
    currency: string;
    date: string;
  };
  payment_information: {
    payment_method: string;
    card_type?: string;
    last_four_digits?: string;
    expiry_date?: string;
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface PricingConfig {
  plans: PricingPlan[];
  features: PricingFeature[];
  currency: string;
  taxInclusive: boolean;
}

export interface BillingSettings {
  allowUsageOverages: boolean;
  overageRate: number; // Per video for basic plan
  gracePeriod: number; // Days before limiting access
  invoicePrefix: string;
  autoRetryFailedPayments: boolean;
  maxRetryAttempts: number;
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'pay-per-video',
    tier: 'pay-per-video',
    name: 'Pay-per-Video',
    description: 'Perfect for occasional use',
    price: 2.49,
    currency: 'USD',
    interval: 'one-time',
    paddleProductId: 'pri_01k51d98wsz56f8w2fkywqa9jq',
    features: [
      '1 video generation',
      'HD quality (1080p)',
      'Basic templates',
      'Standard processing'
    ],
    videoLimit: 1,
    commercialRights: false,
    priority: 1,
    buttonText: 'Generate Video',
    buttonVariant: 'outline'
  },
  {
    id: 'basic-monthly',
    tier: 'basic',
    name: 'Basic Plan',
    description: 'Great for regular content creators',
    price: 29,
    currency: 'USD',
    interval: 'month',
    paddleProductId: 'pri_01k51daey5qz8efqz1qf34r878',
    features: [
      '20 videos per month',
      'HD quality (1080p)',
      'Premium templates',
      'Priority processing',
      'Email support'
    ],
    videoLimit: 20,
    commercialRights: false,
    priority: 2,
    buttonText: 'Start Basic',
    buttonVariant: 'secondary'
  },
  {
    id: 'premium-monthly',
    tier: 'premium',
    name: 'Premium Plan',
    description: 'Best for professional creators',
    price: 149,
    currency: 'USD',
    interval: 'month',
    paddleProductId: 'pri_01k51daey5qz8efqz1qf34r878', // Using basic price ID until premium is created
    features: [
      'Unlimited videos',
      '4K quality available',
      'All premium templates',
      'Fastest processing',
      'Commercial license',
      'Priority support',
      'Custom branding',
      'API access'
    ],
    videoLimit: null,
    commercialRights: true,
    priority: 3,
    popular: true,
    highlighted: true,
    buttonText: 'Go Premium',
    buttonVariant: 'primary'
  }
];

export const DEFAULT_PRICING_FEATURES: PricingFeature[] = [
  {
    id: 'video-limit',
    name: 'Monthly Videos',
    included: {
      'pay-per-video': '1 per purchase',
      'basic': '20 videos',
      'premium': 'Unlimited'
    }
  },
  {
    id: 'quality',
    name: 'Video Quality',
    included: {
      'pay-per-video': 'HD (1080p)',
      'basic': 'HD (1080p)',
      'premium': 'Up to 4K'
    }
  },
  {
    id: 'templates',
    name: 'Template Access',
    included: {
      'pay-per-video': 'Basic',
      'basic': 'Premium',
      'premium': 'All Templates'
    }
  },
  {
    id: 'commercial',
    name: 'Commercial Rights',
    included: {
      'pay-per-video': false,
      'basic': false,
      'premium': true
    }
  },
  {
    id: 'support',
    name: 'Support Level',
    included: {
      'pay-per-video': 'Community',
      'basic': 'Email',
      'premium': 'Priority'
    }
  },
  {
    id: 'processing',
    name: 'Processing Speed',
    included: {
      'pay-per-video': 'Standard',
      'basic': 'Priority',
      'premium': 'Fastest'
    }
  },
  {
    id: 'api',
    name: 'API Access',
    included: {
      'pay-per-video': false,
      'basic': false,
      'premium': true
    }
  },
  {
    id: 'branding',
    name: 'Custom Branding',
    included: {
      'pay-per-video': false,
      'basic': false,
      'premium': true
    }
  }
];