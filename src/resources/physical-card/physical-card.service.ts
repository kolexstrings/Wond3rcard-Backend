import HttpException from "../../exceptions/http.exception";
import { CardTemplateModel, PhysicalCardModel } from "./physical-card.model";
import { CardTemplate } from "./physical-card.protocol";
import { PhysicalCard } from "./physical-card.protocol";
import { Types } from "mongoose";

class PhysicalCardService {
  private cardTemplate = CardTemplateModel;
  private physicalCard = PhysicalCardModel;

  public async createCardTemplate(
    name: string,
    design: string,
    priceNaira: number,
    priceUsd: number,
    createdBy: string
  ): Promise<CardTemplate> {
    try {
      const newTemplate = await this.cardTemplate.create({
        name,
        design,
        priceNaira,
        priceUsd,
        createdBy,
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
      console.log("Template in service: ", templateId);

      const template = await this.cardTemplate.findOne({
        _id: new Types.ObjectId(templateId),
      });

      if (!template) {
        return null;
      }

      return template;
    } catch (error) {
      throw new HttpException(500, "Failed to fetch template: ", error);
    }
  }

  public async updateCardTemplate(
    templateId: string,
    name?: string,
    priceNaira?: number,
    priceUsd?: number,
    file?: Express.Multer.File // Make file optional
  ): Promise<CardTemplate> {
    try {
      // Fetch the existing template
      const existingTemplate = await this.cardTemplate.findById(templateId);
      if (!existingTemplate) {
        throw new HttpException(404, "error", "Template not found");
      }

      // Update only provided fields
      if (name) existingTemplate.name = name;
      if (priceNaira !== undefined) existingTemplate.priceNaira = priceNaira;
      if (priceUsd !== undefined) existingTemplate.priceUsd = priceUsd;

      // Update the design only if a file is provided
      if (file) {
        existingTemplate.design = file.path;
      }

      // Save the updated template
      const updatedTemplate = await existingTemplate.save();
      return updatedTemplate;
    } catch (error) {
      throw new HttpException(500, "error", "Failed to update card template");
    }
  }

  public async deleteCardTemplate(templateId: string): Promise<void> {
    try {
      const existingTemplate = await this.cardTemplate.findById(templateId);
      if (!existingTemplate) {
        throw new HttpException(404, "error", "Card template not found");
      }

      await this.cardTemplate.deleteOne({ _id: templateId });
    } catch (error) {
      throw new HttpException(500, "error", "Failed to delete card template");
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
      if (!finalDesign) {
        throw new HttpException(400, "error", "Design file is required");
      }

      // Create the physical card with the SVG string
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
      // Create the physical card with the provided details
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

  public async getAllPhysicalCards() {
    try {
      return await PhysicalCardModel.find().populate(
        "cardTemplate",
        "name priceNaira priceUsd"
      );
    } catch (error) {
      throw new HttpException(
        500,
        "error",
        "Failed to retrieve physical cards"
      );
    }
  }

  public async getUserPhysicalCards(userId: string) {
    try {
      return await PhysicalCardModel.find({ user: userId }).populate(
        "cardTemplate",
        "name priceNaira priceUsd"
      );
    } catch (error) {
      throw new HttpException(
        500,
        "error",
        "Failed to retrieve user's physical cards"
      );
    }
  }

  public async getPhysicalCardById(
    cardId: string
  ): Promise<PhysicalCard | null> {
    try {
      console.log("CardId: ", cardId);
      const objectId = new Types.ObjectId(cardId);
      const physicalCard = await this.physicalCard
        .findOne({ _id: objectId })
        .populate("cardTemplate", "name priceNaira priceUsd");

      if (!physicalCard) {
        return null;
      }

      return physicalCard;
    } catch (error) {
      throw new HttpException(500, "error", "Failed to fetch physical card");
    }
  }

  public async updatePhysicalCard(
    cardId: string,
    primaryColor: string | undefined,
    secondaryColor: string | undefined,
    finalDesign: string | undefined
  ): Promise<PhysicalCard> {
    try {
      // Fetch the existing physical card
      const existingCard = await this.physicalCard.findById(cardId);
      if (!existingCard) {
        throw new HttpException(404, "error", "Physical card not found");
      }

      // Update the card properties if provided
      if (primaryColor) {
        existingCard.primaryColor = primaryColor;
      }
      if (secondaryColor) {
        existingCard.secondaryColor = secondaryColor;
      }

      // Validate and update finalDesign as an SVG string
      if (finalDesign) {
        if (
          !finalDesign.startsWith("<svg") ||
          !finalDesign.endsWith("</svg>")
        ) {
          throw new HttpException(400, "error", "Invalid SVG format");
        }
        existingCard.finalDesign = finalDesign;
      }

      // Save the updated card
      const updatedCard = await existingCard.save();
      return updatedCard;
    } catch (error) {
      throw new HttpException(500, "error", "Failed to update physical card");
    }
  }

  public async updateCustomPhysicalCard(
    cardId: string,
    primaryColor?: string,
    secondaryColor?: string,
    imagePath?: string
  ): Promise<PhysicalCard> {
    try {
      const existingCard = await this.physicalCard.findById(cardId);
      if (!existingCard) {
        throw new HttpException(404, "error", "Custom physical card not found");
      }

      if (primaryColor) existingCard.primaryColor = primaryColor;
      if (secondaryColor) existingCard.secondaryColor = secondaryColor;

      if (imagePath) {
        existingCard.finalDesign = imagePath;
      }

      const updatedCard = await existingCard.save();
      return updatedCard;
    } catch (error) {
      throw new HttpException(
        500,
        "error",
        "Failed to update custom physical card"
      );
    }
  }

  // Delete Physical Card
  public async deletePhysicalCard(cardId: string): Promise<void> {
    try {
      const existingCard = await this.physicalCard.findById(cardId);
      if (!existingCard) {
        throw new HttpException(404, "error", "Physical card not found");
      }
      const objectId = new Types.ObjectId(cardId);
      await this.physicalCard.deleteOne({ _id: objectId });
    } catch (error) {
      throw new HttpException(500, "error", "Failed to delete physical card");
    }
  }
}

export default PhysicalCardService;
