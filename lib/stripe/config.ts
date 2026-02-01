// ============================================
// STRIPE PRICING CONFIGURATION
// ============================================
// Price IDs are loaded from environment variables for flexibility
// Create these products in Stripe Dashboard -> Products

export interface PlanPrice {
  id: string;
  amount: number; // in cents (e.g., 900 = €9.00)
  interval: 'month' | 'year';
}

export interface Plan {
  name: string;
  quota: number; // -1 means unlimited
  prices: {
    monthly: PlanPrice;
    annual: PlanPrice;
  };
}

export interface CreditPackage {
  credits: number;
  priceId: string;
  amount: number; // in cents
}

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export const PLANS = {
  starter: {
    name: 'Starter',
    quota: 30,
    prices: {
      monthly: {
        id: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
        amount: 900, // €9
        interval: 'month' as const,
      },
      annual: {
        id: process.env.STRIPE_PRICE_STARTER_ANNUAL!,
        amount: 9000, // €90
        interval: 'year' as const,
      },
    },
  },
  pro: {
    name: 'Pro',
    quota: 70,
    prices: {
      monthly: {
        id: process.env.STRIPE_PRICE_PRO_MONTHLY!,
        amount: 1900, // €19
        interval: 'month' as const,
      },
      annual: {
        id: process.env.STRIPE_PRICE_PRO_ANNUAL!,
        amount: 19000, // €190
        interval: 'year' as const,
      },
    },
  },
  unlimited: {
    name: 'Unlimited',
    quota: -1, // -1 means unlimited
    prices: {
      monthly: {
        id: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY!,
        amount: 4900, // €49
        interval: 'month' as const,
      },
      annual: {
        id: process.env.STRIPE_PRICE_UNLIMITED_ANNUAL!,
        amount: 49000, // €490
        interval: 'year' as const,
      },
    },
  },
} as const;

// ============================================
// CREDIT PACKAGES
// ============================================

export const CREDIT_PACKAGES = {
  '10': {
    credits: 10,
    priceId: process.env.STRIPE_PRICE_CREDITS_10!,
    amount: 500, // €5
  },
  '30': {
    credits: 30,
    priceId: process.env.STRIPE_PRICE_CREDITS_30!,
    amount: 1200, // €12
  },
  '100': {
    credits: 100,
    priceId: process.env.STRIPE_PRICE_CREDITS_100!,
    amount: 3500, // €35
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export type PlanKey = keyof typeof PLANS;
export type CreditPackageKey = keyof typeof CREDIT_PACKAGES;

/**
 * Lookup plan configuration by Stripe price ID
 * Used in webhook handlers to identify which plan a user subscribed to
 */
export function getPlanByPriceId(priceId: string): {
  key: PlanKey;
  plan: Plan;
  interval: 'month' | 'year';
} | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.prices.monthly.id === priceId) {
      return { key: key as PlanKey, plan, interval: 'month' };
    }
    if (plan.prices.annual.id === priceId) {
      return { key: key as PlanKey, plan, interval: 'year' };
    }
  }
  return null;
}

/**
 * Lookup credit package by Stripe price ID
 * Used in webhook handlers to identify credit purchase amounts
 */
export function getCreditPackageByPriceId(priceId: string): {
  key: CreditPackageKey;
  package: CreditPackage;
} | null {
  for (const [key, pkg] of Object.entries(CREDIT_PACKAGES)) {
    if (pkg.priceId === priceId) {
      return { key: key as CreditPackageKey, package: pkg };
    }
  }
  return null;
}
