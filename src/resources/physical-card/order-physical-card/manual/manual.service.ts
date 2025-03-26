import axios from "axios";
import HttpException from "../../../../exceptions/http.exception";
import NodeMailerService from "../../../mails/nodemailer.service";
import userModel from "../../../user/user.model";
import TransactionModel from "../../../payments/transactions.model";
import { generateTransactionId } from "../../../../utils/generateTransactionId";
import MailTemplates from "../../../mails/mail.templates";
import PhysicalCardService from "../../physical-card.service";
import PhysicalCardOrder from "../order.model";
class ManualOrderService {
  private mailer = new NodeMailerService();
  private physicalCardService = new PhysicalCardService();
  public async createManualOrder(
    userId: string,
    physicalCardId: string,
    cardTemplateId: string,
    quantity: number,
    region: string,
    address: string
  ) {
    // Fetch the user
    const user = await userModel.findById(userId);
    if (!user) throw new HttpException(404, "error", "User not found");
    // Fetch card template details (includes price)
    const cardTemplate = await this.physicalCardService.getTemplateById(
      cardTemplateId
    );
    if (!cardTemplate) {
      throw new HttpException(404, "error", "Card template not found");
    }

    const referenceId = generateTransactionId("card_order", "manual");
    const paidAt = new Date();
    const { priceNaira, priceUsd } = cardTemplate;

    // Calculate total price based on region
    let totalPrice: number;
    if (region.toLowerCase() === "nigeria") {
      totalPrice = quantity * priceNaira;
    } else {
      totalPrice = quantity * priceUsd;
    }

    // Save the order in PhysicalCardOrder
    const order = await PhysicalCardOrder.create({
      userId,
      cardId: physicalCardId,
      quantity,
      region,
      address,
      price: totalPrice,
      status: "paid",
    });
    const orderId = order._id.toString();

    // Save the transaction record for manual order
    const transaction = await TransactionModel.create({
      userId,
      userName: user.username,
      email: user.email,
      amount: totalPrice,
      referenceId,
      transactionType: "card_order",
      status: "success",
      paymentProvider: "manual",
      paidAt,
    });

    // Send confirmation email
    const template = MailTemplates.physicalCardOrderConfirmation;
    const email = user.email;
    const emailData = {
      name: user.username,
      address,
      price: String(totalPrice),
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

    // Populate order with cardId
    const populatedOrder = await order.populate("cardId");

    return { order: populatedOrder, transaction };
  }
}

export default ManualOrderService;
