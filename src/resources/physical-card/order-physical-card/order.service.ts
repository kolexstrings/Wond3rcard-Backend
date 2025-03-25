import HttpException from "../../../exceptions/http.exception";
import PhysicalCardService from "../physical-card.service";
import PaystackService from "./paystack/paystack.service";
import StripeService from "./stripe/stripe.service";
import PhysicalCardOrder from "./order.model"; // Import order model for saving order

class PhysicalCardOrderService {
  private physicalCardService = new PhysicalCardService();
  private paystackService = new PaystackService();
  private stripeService = new StripeService();

  public async createOrder(
    userId: string,
    physicalCardId: string,
    cardTemplateId: string,
    quantity: number,
    region: string
  ) {
    // Fetch card template details (includes price)
    const cardTemplate = await this.physicalCardService.getTemplateById(
      cardTemplateId
    );
    if (!cardTemplate) {
      throw new HttpException(404, "error", "Card template not found");
    }

    const { priceNaira, priceUsd } = cardTemplate;

    let totalPrice: number;
    let paymentUrl: string;
    let currency: string;

    // Determine pricing and payment gateway
    if (region.toLowerCase() === "nigeria") {
      totalPrice = quantity * priceNaira;
      paymentUrl = await this.paystackService.initializePayment(
        userId,
        totalPrice
      );
      currency = "NGN";
    } else {
      totalPrice = quantity * priceUsd;
      paymentUrl = await this.stripeService.createCheckoutSession(
        userId,
        totalPrice
      );
      currency = "USD";
    }

    // Save order to database
    const order = await PhysicalCardOrder.create({
      userId,
      cardId: physicalCardId,
      quantity,
      region,
      totalPrice,
      status: "pending",
    });

    // Populate the physicalCard details before returning
    const populatedOrder = await order.populate("cardId");

    return {
      ...populatedOrder.toObject(),
      paymentUrl, // Include the generated payment link
      currency,
    };
  }
}

export default PhysicalCardOrderService;
