export interface CreateSubscriptionTier {
  name: string;
  billingCycle: {
    monthly: {
      price: number;
      durationInDays?: number;
      planCode: string;
    };
    yearly: {
      price: number;
      durationInDays?: number;
      planCode: string;
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
