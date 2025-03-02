import axios from "axios";

class PaystackService {
  private secretKey = process.env.PAYSTACK_SECRET_KEY!;
  private baseUrl = "https://api.paystack.co";

  async initializePayment(email: string, amount: number, metadata: any) {
    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      {
        email,
        amount: amount * 100, // Convert amount to kobo
        callback_url: `${process.env.BASE_URL}/payment-success`,
        metadata,
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
