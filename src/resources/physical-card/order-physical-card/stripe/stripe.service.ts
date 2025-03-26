import stripe from "../../../../config/stripe";
import HttpException from "../../../../exceptions/http.exception";
import userModel from "../../../user/user.model";
import TransactionModel from "../../../payments/transactions.model";
import PhysicalCardOrder from "../order.model";
import { generateTransactionId } from "../../../../utils/generateTransactionId";
import NodeMailerService from "../../../mails/nodemailer.service";
import MailTemplates from "../../../mails/mail.templates";
import { PhysicalCardStatus } from "../../physical-card.protocol";

class StripeOrderService {
  private mailer = new NodeMailerService();
  public async createCheckoutSession(
    userId: string,
    amount: number,
    orderId: string,
    address: string
  ): Promise<string> {
    try {
      const session = await stripe.checkout.sessions.create({
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
        success_url: `${process.env.FRONTEND_BASE_URL}/payment-success`,
        cancel_url: `${process.env.FRONTEND_BASE_URL}/payment-failed`,
        metadata: {
          userId,
          transactionType: "card_order",
          orderId,
          address,
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

  public async handleSuccessfulCardOrder(session: any) {
    const { userId, transactionType, orderId, address } = session.metadata;

    const user = await userModel.findById(userId);
    if (!user) throw new Error("User not found");

    const transactionId = session.id; // Stripe’s unique ID
    const referenceId = generateTransactionId("card_order", "stripe"); // Custom transaction ID
    const paymentMethod = session.payment_method_types?.[0] || "unknown";
    const paidAt = new Date(session.created * 1000); // Stripe timestamps in seconds
    const amount = session.amount_total / 100;

    const existingTransaction = await TransactionModel.findOne({
      transactionId: transactionId,
    });
    if (existingTransaction) {
      return { message: "Transaction already processed" };
    }

    // Find the existing order
    const order = await PhysicalCardOrder.findById(orderId);
    if (!order) throw new HttpException(404, "error", "Order not found");

    order.status = PhysicalCardStatus.Paid;
    await order.save();

    // Store transaction details
    await TransactionModel.create({
      userId,
      userName: user.username,
      email: user.email,
      amount,
      referenceId, // Custom transaction ID
      transactionId, // Stripe's ID
      transactionType,
      paymentProvider: "stripe",
      status: "success",
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

export default StripeOrderService;
