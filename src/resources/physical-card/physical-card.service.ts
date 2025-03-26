import HttpException from "../../exceptions/http.exception";
import { CardTemplateModel, PhysicalCardModel } from "./physical-card.model";
import { CardTemplate } from "./physical-card.protocol";
import { PhysicalCard } from "./physical-card.protocol";
import path from "path";

class PhysicalCardService {
  private cardTemplate = CardTemplateModel;
  private physicalCard = PhysicalCardModel;

  public async createCardTemplate(
    name: string,
    design: string,
    priceNaira: number,
    priceUsd: number,
    createdBy: string // Add createdBy parameter
  ): Promise<CardTemplate> {
    try {
      const newTemplate = await this.cardTemplate.create({
        name,
        design,
        priceNaira,
        priceUsd,
        createdBy, // Include createdBy field
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

  public async updateCardTemplate(
    templateId: string,
    name: string | undefined,
    priceNaira: number | undefined,
    priceUsd: number | undefined,
    file: Express.Multer.File | undefined
  ): Promise<CardTemplate> {
    try {
      // Fetch the existing card template
      const existingTemplate = await this.cardTemplate.findById(templateId);
      if (!existingTemplate) {
        throw new HttpException(404, "error", "Card template not found");
      }

      // Update the template properties if provided
      if (name) {
        existingTemplate.name = name;
      }
      if (priceNaira) {
        existingTemplate.priceNaira = priceNaira;
      }
      if (priceUsd) {
        existingTemplate.priceUsd = priceUsd;
      }

      // Handle file upload if a new file is provided (used as the 'design')
      if (file) {
        existingTemplate.design = file.path; // Assuming 'design' is where the file path is stored
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
    finalDesign: string, // This will be the file path (from Multer)
    primaryColor: string,
    secondaryColor: string
  ): Promise<PhysicalCard> {
    try {
      // Ensure the finalDesign is provided
      if (!finalDesign) {
        throw new HttpException(400, "error", "Design file is required");
      }

      // Create the physical card with the uploaded final design file path
      const newPhysicalCard = await this.physicalCard.create({
        user: userId,
        cardId,
        cardTemplate: templateId,
        primaryColor,
        secondaryColor,
        finalDesign, // Save the path of the uploaded design file
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
  public async updatePhysicalCard(
    cardId: string,
    primaryColor: string | undefined,
    secondaryColor: string | undefined,
    finalDesign: string | undefined,
    file: Express.Multer.File | undefined
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

      // Handle file update for finalDesign
      if (file) {
        // Validate the file extension (support PNG, JPG, JPEG, SVG)
        const validExtensions = [".png", ".jpg", ".jpeg", ".svg"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (!validExtensions.includes(fileExtension)) {
          throw new HttpException(
            400,
            "error",
            "Invalid file type for finalDesign"
          );
        }
        existingCard.finalDesign = file.path; // Save the new file's path
      } else if (finalDesign) {
        existingCard.finalDesign = finalDesign;
      }

      // Save the updated card
      const updatedCard = await existingCard.save();
      return updatedCard;
    } catch (error) {
      throw new HttpException(500, "error", "Failed to update physical card");
    }
  }

  // Delete Physical Card
  public async deletePhysicalCard(cardId: string): Promise<void> {
    try {
      const existingCard = await this.physicalCard.findById(cardId);
      if (!existingCard) {
        throw new HttpException(404, "error", "Physical card not found");
      }

      await this.physicalCard.deleteOne({ _id: cardId });
    } catch (error) {
      throw new HttpException(500, "error", "Failed to delete physical card");
    }
  }
}

export default PhysicalCardService;
