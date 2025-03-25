import axios from "axios";
import HttpException from "../../exceptions/http.exception";

class PaystackService {
  private PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  private PAYSTACK_BASE_URL = "https://api.paystack.co";

  public async initializePayment(
    userId: string,
    amount: number
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          email: `${userId}@example.com`, // Replace with real user email
          amount: amount * 100, // Convert to kobo
          currency: "NGN",
          callback_url: `${process.env.FRONTEND_URL}/payment-success`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        return response.data.data.authorization_url; // URL for user to complete payment
      }

      throw new HttpException(400, "error", "Failed to initialize payment");
    } catch (error) {
      throw new HttpException(
        500,
        "error",
        error.response?.data?.message || "Paystack payment error"
      );
    }
  }
}

export default PaystackService;
