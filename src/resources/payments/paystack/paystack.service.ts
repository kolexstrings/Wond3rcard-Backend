import axios from "axios";
import tierModel from "../../admin/subscriptionTier/tier.model";

class PaystackService {
  private secretKey = process.env.PAYSTACK_SECRET_KEY!;
  private baseUrl = "https://api.paystack.co";

  async initializePayment(
    userId: string,
    plan: string,
    billingCycle: "monthly" | "yearly"
  ) {
    const tier = await tierModel.findOne({ name: plan.toLowerCase() });
    if (!tier) throw new Error("Invalid subscription tier");

    const { price, durationInDays } = tier.billingCycle[billingCycle];

    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      {
        email: "user_email_placeholder", // Replace this with user email from DB
        amount: price * 100, // Convert to kobo
        callback_url: `${process.env.FRONTEND_BASE_URL}/payment-success`,
        metadata: {
          userId,
          plan,
          billingCycle,
          durationInDays,
        },
      },
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      }
    );

    return response.data;
  }

  async verifyTransaction(reference: string) {
    const response = await axios.get(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      }
    );

    return response.data;
  }
}

export default new PaystackService();
