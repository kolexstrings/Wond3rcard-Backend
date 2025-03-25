import HttpException from "../../exceptions/http.exception";
import { CardTemplateModel, PhysicalCardModel } from "./physical-card.model";
import { CardTemplate } from "./physical-card.protocol";
import { PhysicalCard } from "./physical-card.protocol";
import PaystackService from "./order-physical-card/paystack/paystack.service";
import StripeService from "./order-physical-card/stripe/stripe.service";

class PhysicalCardService {
  private cardTemplate = CardTemplateModel;
  private physicalCard = PhysicalCardModel;
  private paystackService = new PaystackService();
  private stripeService = new StripeService();

  public async createCardTemplate(
    name: string,
    design: string,
    priceNaira: number,
    priceUsd: number
  ): Promise<CardTemplate> {
    try {
      const newTemplate = await this.cardTemplate.create({
        name,
        design,
        priceNaira,
        priceUsd,
      });
      return newTemplate;
    } catch (error) {
      throw new HttpException(500, "error", "Failed to create card template");
    }
  }

  public async getTemplates(): Promise<CardTemplate[]> {
    try {
      const templates = await this.cardTemplate.find();
      return templates;
    } catch (error) {
      throw new HttpException(500, "error", "Failed to fetch card templates");
    }
  }

  public async getTemplateById(
    templateId: string
  ): Promise<CardTemplate | null> {
    try {
      const template = await this.cardTemplate.findOne({
        where: { id: templateId },
      });

      if (!template) {
        return null;
      }

      return template;
    } catch (error) {
      throw new HttpException(500, "error", "Failed to fetch template");
    }
  }

  public async createPhysicalCard(
    userId: string,
    cardId: string,
    templateId: string,
    finalDesign: string,
    primaryColor: string,
    secondaryColor: string
  ): Promise<PhysicalCard> {
    try {
      // Create the physical card
      const newPhysicalCard = await this.physicalCard.create({
        user: userId,
        cardId,
        cardTemplate: templateId,
        primaryColor,
        secondaryColor,
        finalDesign,
        isCustom: false,
        status: "pending",
      });

      // Populate the template details
      const populatedPhysicalCard = await this.physicalCard
        .findById(newPhysicalCard._id)
        .populate("cardTemplate", "name priceNaira priceUsd");

      return populatedPhysicalCard;
    } catch (error) {
      throw new HttpException(500, "error", "Failed to create physical card");
    }
  }

  public async createCustomPhysicalCard(
    userId: string,
    cardId: string,
    templateId: string,
    primaryColor: string,
    secondaryColor: string,
    finalDesign: string
  ): Promise<PhysicalCard> {
    try {
      const newPhysicalCard = await this.physicalCard.create({
        user: userId,
        cardId,
        cardTemplate: templateId,
        primaryColor,
        secondaryColor,
        finalDesign,
        isCustom: true,
        status: "pending",
      });

      // Populate the template details
      const populatedPhysicalCard = await this.physicalCard
        .findById(newPhysicalCard._id)
        .populate("cardTemplate", "name priceNaira priceUsd");

      return populatedPhysicalCard;
    } catch (error) {
      throw new HttpException(500, "error", "Failed to create physical card");
    }
  }

  public async getPhysicalCardById(
    cardId: string
  ): Promise<PhysicalCard | null> {
    try {
      const physicalCard = await this.physicalCard
        .findById(cardId)
        .populate("cardTemplate", "name priceNaira priceUsd");

      if (!physicalCard) {
        return null;
      }

      return physicalCard;
    } catch (error) {
      throw new HttpException(500, "error", "Failed to fetch physical card");
    }
  }
}

export default PhysicalCardService;
