import stripe from "../../../config/stripe";
import tierModel from "../../admin/subscriptionTier/tier.model";

class StripeService {
  async createCheckoutSession(
    userId: string,
    plan: string,
    billingCycle: string
  ) {
    const tier = await tierModel.findOne({ name: plan }).lean();
    if (!tier) throw new Error("Invalid plan selected");

    const selectedBilling =
      billingCycle === "yearly"
        ? tier.billingCycle.yearly
        : tier.billingCycle.monthly;

    return await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: plan },
            unit_amount: selectedBilling.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: { userId, plan, billingCycle },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
    });
  }
}

export default new StripeService();
