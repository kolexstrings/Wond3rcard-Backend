export interface CreateSubscriptionTier {
  name: string;
  billingCycle: {
    monthly: {
      priceUSD: number;
      priceNGN: number;
      durationInDays?: number;
      stripePlanCode: string;
      paystackPlanCode: string;
    };
    yearly: {
      priceUSD: number;
      priceNGN: number;
      durationInDays?: number;
      stripePlanCode: string;
      paystackPlanCode: string;
    };
  };
  description: string;
  trialPeriod: number;
  autoRenew: boolean;
  features: string[];
}

export interface CreateSocialMedia {
  name: string;
  iconUrl: string;
}
