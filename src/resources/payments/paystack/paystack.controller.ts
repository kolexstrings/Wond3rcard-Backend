import { Request, Response } from "express";
import paystackService from "./paystack.service";
import userModel from "../../user/user.model";

export const initializePayment = async (req: Request, res: Response) => {
  try {
    const { userId, plan } = req.body;
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const amount = plan === "premium" ? 5000 : 10000; // Example pricing

    const response = await paystackService.initializePayment(
      user.email,
      amount,
      {
        userId,
        plan,
      }
    );

    return res.json({ checkoutUrl: response.data.authorization_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const paystackSignature = req.headers["x-paystack-signature"];

    if (!paystackSignature)
      return res.status(401).json({ message: "Unauthorized" });

    const { event, data } = req.body;

    if (event === "charge.success") {
      const { userId, plan } = data.metadata;
      const transactionId = data.id;

      const user = await userModel.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.userTier = {
        plan,
        status: "active",
        transactionId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      await user.save();
      return res.status(200).json({ message: "Subscription activated" });
    }

    res.status(400).json({ message: "Unhandled event" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};
