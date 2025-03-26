import axios from "axios";
import HttpException from "../../../../exceptions/http.exception";
import NodeMailerService from "../../../mails/nodemailer.service";
import userModel from "../../../user/user.model";
import TransactionModel from "../../../payments/transactions.model";
import { PhysicalCardModel } from "../../physical-card.model";
import { generateTransactionId } from "../../../../utils/generateTransactionId";
import MailTemplates from "../../../mails/mail.templates";
import { PhysicalCardStatus } from "../../physical-card.protocol";
import PhysicalCardOrder from "../order.model";

class PaystackOrderService {
  private secretKey = process.env.PAYSTACK_SECRET_KEY;
  private baseUrl = "https://api.paystack.co";
  private mailer = new NodeMailerService();
  public async initializePayment(
    userId: string,
    amount: number,
    orderId: string,
    address: string
  ): Promise<string> {
    try {
      const user = await userModel.findById(userId);
      if (!user) throw new Error("User not found");
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email: user.email,
          amount: amount * 100, // Convert to kobo
          currency: "NGN",
          callback_url: `${process.env.FRONTEND_BASE_URL}/payment-success`,
          metadata: {
            transactionType: "card_order",
            userId,
            orderId,
            address,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        return response.data.data.authorization_url; // Return the payment link
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

  public async verifyTransaction(reference: string) {
    const response = await axios.get(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      }
    );

    return response.data;
  }

  public async handleSuccessfulCardOrder(data: any) {
    const { userId, orderId, transactionType, address } = data.metadata;

    // Fetch the user
    const user = await userModel.findById(userId);
    if (!user) throw new HttpException(404, "error", "User not found");

    // Prevent duplicate transactions
    const existingTransaction = await TransactionModel.findOne({
      transactionId: data.id,
    });
    if (existingTransaction) {
      return { message: "Transaction already processed" };
    }

    // Find the existing order
    const order = await PhysicalCardOrder.findById(orderId);
    if (!order) throw new HttpException(404, "error", "Order not found");

    // Extract payment details
    const transactionId = data.id;
    const referenceId = generateTransactionId("card_order", "paystack");
    const amount = data.amount / 100;
    const paymentMethod = data.channel;
    const paidAt = new Date(data.paid_at);

    // Update order status to "paid"
    order.status = PhysicalCardStatus.Paid;
    await order.save();

    // Save transaction log
    await TransactionModel.create({
      userId,
      userName: user.username,
      email: user.email,
      amount,
      transactionId,
      referenceId,
      transactionType,
      status: "success",
      paymentProvider: "paystack",
      paymentMethod,
      paidAt,
    });

    // Send confirmation email
    const template = MailTemplates.physicalCardOrderConfirmation;
    const email = user.email;
    const emailData = {
      name: user.username,
      address,
      price: String(amount),
      paidAt: paidAt.toDateString(),
      orderId,
    };

    await this.mailer.sendMail(
      email,
      "Order Confirmation",
      template,
      "Order Successful",
      emailData
    );

    return { message: "Order placed successfully", orderId: orderId };
  }
}

export default PaystackOrderService;
