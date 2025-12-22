import tierModel, { ITier } from "../admin/subscriptionTier/tier.model";

class SubscriptionService {
  public async getPublicTiers(): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      features: string[];
      trialPeriod: number;
      autoRenew: boolean;
      billingCycle: ITier["billingCycle"];
    }>
  > {
    const tiers = await tierModel
      .find({})
      .select(
        "_id name description features trialPeriod autoRenew billingCycle"
      )
      .lean();

    return tiers.map((tier) => ({
      id: tier._id.toString(),
      name: tier.name,
      description: tier.description,
      features: tier.features,
      trialPeriod: tier.trialPeriod,
      autoRenew: tier.autoRenew,
      billingCycle: tier.billingCycle,
    }));
  }
}

export default SubscriptionService;
