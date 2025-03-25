import axios from "axios";
import HttpException from "../../../../exceptions/http.exception";
import NodeMailerService from "../../../mails/nodemailer.service";
import userModel from "../../../user/user.model";
import TransactionModel from "../../../payments/transactions.model";
import { PhysicalCardModel } from "../../physical-card.model";
import { generateTransactionId } from "../../../../utils/generateTransactionId";
import MailTemplates from "../../../mails/mail.templates";
import { PhysicalCardStatus } from "../../physical-card.protocol";
import PhysicalCardOrderService from "../order.service";

class ManualOrderService {
  private secretKey = process.env.PAYSTACK_SECRET_KEY;
  private baseUrl = "https://api.paystack.co";
  private mailer = new NodeMailerService();
  private physicalOrderCardService = new PhysicalCardOrderService();
  public async createManualOrder(
    userId: string,
    physicalCardId: string,
    cardTemplateId: string,
    quantity: number,
    region: string,
    address: string
  ) {
    // Fetch card template details (includes price)
    const cardTemplate = await this.physicalOrderCardService.getTemplateById(
      cardTemplateId
    );
    if (!cardTemplate) {
      throw new HttpException(404, "error", "Card template not found");
    }

    const { priceNaira, priceUsd } = cardTemplate;

    // Calculate total price based on region
    let totalPrice: number;
    if (region.toLowerCase() === "nigeria") {
      totalPrice = quantity * priceNaira;
    } else {
      totalPrice = quantity * priceUsd;
    }

    // Save the order in PhysicalCardOrder
    const order = await PhysicalCardModel.create({
      userId,
      cardId: physicalCardId,
      quantity,
      region,
      address,
      price: totalPrice,
      status: "manual", // Marking as a manual order
    });

    // Save the transaction record for manual order
    const transaction = await TransactionModel.create({
      orderId: order._id,
      amount: totalPrice,
      status: "completed", // Assuming the status is completed for manual orders
      method: "manual", // Marking as a manual transaction
    });

    // Populate order with cardId
    const populatedOrder = await order.populate("cardId");

    return { order: populatedOrder, transaction };
  }
}

export default ManualOrderService;
