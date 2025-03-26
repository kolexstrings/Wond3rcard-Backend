import HttpException from "../../../exceptions/http.exception";
import PhysicalCardService from "../physical-card.service";
import PaystackService from "./paystack/paystack.service";
import StripeService from "./stripe/stripe.service";
import PhysicalCardOrder from "./order.model";
import IPhysicalCardOrder from "./order.protocol";
import { PhysicalCardStatus } from "../physical-card.protocol";

class PhysicalCardOrderService {
  private physicalCardService = new PhysicalCardService();
  private paystackService = new PaystackService();
  private stripeService = new StripeService();

  public async createOrder(
    userId: string,
    physicalCardId: string,
    cardTemplateId: string,
    quantity: number,
    region: string,
    address: string
  ) {
    // Fetch card template details (includes price)
    const cardTemplate = await this.physicalCardService.getTemplateById(
      cardTemplateId
    );
    if (!cardTemplate) {
      throw new HttpException(404, "error", "Card template not found");
    }
    const formattedRegion = region.toLowerCase();
    const { priceNaira, priceUsd } = cardTemplate;
    const totalPrice =
      formattedRegion === "nigeria"
        ? quantity * priceNaira
        : quantity * priceUsd;
    const currency = formattedRegion === "nigeria" ? "NGN" : "USD";

    // **Create the order first**
    const order = await PhysicalCardOrder.create({
      userId,
      cardId: physicalCardId,
      quantity,
      region: formattedRegion,
      address,
      price: totalPrice,
      status: "pending",
    });

    const orderId = order._id.toString();

    // **Now initialize payment with orderId**
    const paymentUrl =
      region.toLowerCase() === "nigeria"
        ? await this.paystackService.initializePayment(
            userId,
            totalPrice,
            orderId,
            address
          )
        : await this.stripeService.createCheckoutSession(
            userId,
            totalPrice,
            orderId,
            address
          );

    // **Update the order with the paymentUrl**
    await PhysicalCardOrder.findByIdAndUpdate(orderId, { paymentUrl });

    // Populate the physicalCard details before returning
    const populatedOrder = await order.populate("cardId");

    return {
      orderId,
      ...populatedOrder.toObject(),
      paymentUrl, // Include the generated payment link
      currency,
    };
  }

  public getAllOrders = async (): Promise<IPhysicalCardOrder[]> => {
    return await PhysicalCardOrder.find();
  };

  public getOrderById = async (
    orderId: string
  ): Promise<IPhysicalCardOrder | null> => {
    return await PhysicalCardOrder.findById(orderId);
  };

  public getUserOrders = async (
    userId: string
  ): Promise<IPhysicalCardOrder[]> => {
    return await PhysicalCardOrder.find({ userId });
  };

  public async updateOrderStatus(
    orderId: string,
    status: string
  ): Promise<IPhysicalCardOrder | null> {
    if (
      !Object.values(PhysicalCardStatus).includes(status as PhysicalCardStatus)
    ) {
      throw new HttpException(400, "error", "Invalid order status");
    }
    const order = await PhysicalCardOrder.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    if (!order) {
      throw new HttpException(404, "error", "Order not found");
    }
    return order;
  }

  public async deleteOrder(orderId: string): Promise<void> {
    const order = await PhysicalCardOrder.findById(orderId);
    if (!order) {
      throw new HttpException(404, "error", "Order not found");
    }
    await PhysicalCardOrder.findByIdAndDelete(orderId);
  }
}

export default PhysicalCardOrderService;
