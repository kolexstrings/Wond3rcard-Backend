import HttpException from "../../exceptions/http.exception";
import { CardTemplateModel, PhysicalCardModel } from "./physical-card.model";
import { CardTemplate } from "./physical-card.protocol";
import { PhysicalCard } from "./physical-card.protocol";

class PhysicalCardService {
  private cardTemplate = CardTemplateModel;
  private physicalCard = PhysicalCardModel;

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
