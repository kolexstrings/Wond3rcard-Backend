import HttpException from "../../exceptions/http.exception";
import cardTemplateModel from "../models/cardTemplate.model";
import physicalCardModel from "../models/physicalCard.model";
import { CardTemplate } from "../protocols/cardTemplate.protocol";
import { PhysicalCard } from "../protocols/physicalCard.protocol";

class PhysicalCardService {
  private cardTemplate = cardTemplateModel;
  private physicalCard = physicalCardModel;

  public async createCardTemplate(
    name: string,
    design: string,
    price: number
  ): Promise<CardTemplate> {
    try {
      const newTemplate = await this.cardTemplate.create({
        name,
        design,
        price,
      });
      return newTemplate;
    } catch (error) {
      throw new HttpException(500, "error", "Failed to create card template");
    }
  }

  public async orderPhysicalCard(
    userId: string,
    cardId: string,
    templateId: string,
    quantity: number,
    primaryColor: string,
    secondaryColor: string,
    finalSvg: string
  ): Promise<PhysicalCard> {
    try {
      const newOrder = await this.physicalCard.create({
        userId,
        cardId,
        templateId,
        quantity,
        primaryColor,
        secondaryColor,
        finalSvg,
        status: "pending",
      });
      return newOrder;
    } catch (error) {
      throw new HttpException(
        500,
        "error",
        "Failed to place order for physical card"
      );
    }
  }
}

export default PhysicalCardService;
