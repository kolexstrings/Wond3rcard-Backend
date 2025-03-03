import axios from "axios";
import tierModel from "../../admin/subscriptionTier/tier.model";
import userModel from "../../user/user.model";

class PaystackService {
  private secretKey = process.env.PAYSTACK_SECRET_KEY!;
  private baseUrl = "https://api.paystack.co";

  public async initializePayment(
    userId: string,
    plan: string,
    billingCycle: "monthly" | "yearly"
  ) {
    const user = await userModel.findById(userId);
    if (!user) throw new Error("User not found");
    const tier = await tierModel.findOne({ name: plan.toLowerCase() });
    if (!tier) throw new Error("Invalid subscription tier");

    const { price, durationInDays } = tier.billingCycle[billingCycle];

    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      {
        email: user.email,
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

  public async verifyTransaction(reference: string) {
    const response = await axios.get(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      }
    );

    return response.data;
  }
}

export default PaystackService;
