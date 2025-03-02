export interface CreateSubscriptionTier {
  name: string;
  billingCycle: {
    monthlyPrice: number;
    yearlyPrice: number;
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
