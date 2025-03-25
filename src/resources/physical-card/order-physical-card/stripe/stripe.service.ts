import Stripe from "stripe";
import HttpException from "../../../../exceptions/http.exception";

class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2023-10-16",
  });

  public async createCheckoutSession(
    userId: string,
    amount: number
  ): Promise<string> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Physical Card",
              },
              unit_amount: amount * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/payment-success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
        metadata: {
          userId,
        },
      });

      return session.url || "";
    } catch (error) {
      throw new HttpException(
        500,
        "error",
        error.message || "Stripe payment error"
      );
    }
  }
}

export default StripeService;
