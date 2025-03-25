import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import GeneralController from "../../protocols/global.controller";
import PhysicalCardService from "./physical-card.service";
import multer from "multer";
import { parsePrice } from "../../utils/parsePrice";
import validationMiddleware from "../../middlewares/validation.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import { UserRole } from "../user/user.protocol";
import validate from "./physical-card.validation";

const upload = multer({ dest: "uploads/templates/" });

class PhysicalCardController implements GeneralController {
  public path = "/cards";
  public router = Router();
  private physicalCardService = new PhysicalCardService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.post(
      `${this.path}/create-template`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validate.validateCardTemplate),
      ],
      upload.single("svg"),
      this.createTemplate
    );

    this.router.get(
      `${this.path}/templates`,
      authenticatedMiddleware,
      this.getTemplates
    );

    this.router.get(
      `${this.path}/template/:templateId`,
      [
        authenticatedMiddleware,
        validationMiddleware(validate.validateTemplateId),
      ],
      this.getTemplateById
    );

    this.router.put(
      `${this.path}/template/:templateId`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.updateCardTemplate
    );

    this.router.delete(
      `${this.path}/template/:templateId`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.deleteCardTemplate
    );

    this.router.post(
      `${this.path}/create-physical-card`,
      [
        authenticatedMiddleware,
        validationMiddleware(validate.validateCustomPhysicalCard),
      ],
      this.createPhysicalCard
    );

    this.router.post(
      `${this.path}/create-custom`,
      [
        authenticatedMiddleware,
        validationMiddleware(validate.validateCustomPhysicalCard),
      ],
      upload.single("photo"),
      this.createCustomPhysicalCard
    );

    this.router.get(
      `${this.path}/physical/:cardId`,
      [
        authenticatedMiddleware,
        validationMiddleware(validate.validateGetPhysicalCardById),
      ],
      this.getPhysicalCardById
    );

    this.router.put(
      `${this.path}/update-physical-card/:cardId`,
      authenticatedMiddleware,
      validationMiddleware(validate.validatePhysicalCardUpdate),
      this.updatePhysicalCard
    );

    this.router.delete(
      `${this.path}/delete-physical-card/:cardId`,
      authenticatedMiddleware,
      this.deletePhysicalCard
    );
  }

  private createTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        return next(new HttpException(400, "error", "SVG file is required"));
      }

      const { name, priceNaira, priceUsd } = req.body;

      let parsedPriceNaira: number;
      try {
        parsedPriceNaira = parsePrice(priceNaira);
      } catch (error) {
        return next(error);
      }

      let parsedPriceUsd: number;
      try {
        parsedPriceUsd = parsePrice(priceUsd);
      } catch (error) {
        return next(error);
      }

      const template = await this.physicalCardService.createCardTemplate(
        name,
        req.file.path,
        parsedPriceNaira,
        parsedPriceUsd
      );

      res.status(201).json({
        statusCode: 201,
        status: "success",
        payload: template,
      });
    } catch (error) {
      next(error);
    }
  };

  private getTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const templates = await this.physicalCardService.getTemplates();
      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: templates,
      });
    } catch (error) {
      next(error);
    }
  };

  private getTemplateById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { templateId } = req.params;

      // Validate templateId
      if (!templateId) {
        return next(new HttpException(400, "error", "Template ID is required"));
      }

      const template = await this.physicalCardService.getTemplateById(
        templateId
      );

      if (!template) {
        return next(new HttpException(404, "error", "Template not found"));
      }

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: template,
      });
    } catch (error) {
      next(error);
    }
  };

  private updateCardTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { templateId } = req.params;
      const { name, priceNaira, priceUsd, design } = req.body;

      // Validate required fields
      if (!name && !priceNaira && !priceUsd && !design) {
        return next(new HttpException(400, "error", "No fields to update"));
      }

      const updatedTemplate = await this.physicalCardService.updateCardTemplate(
        templateId,
        name,
        priceNaira,
        priceUsd,
        design
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: updatedTemplate,
      });
    } catch (error) {
      next(error);
    }
  };

  // Delete Card Template
  private deleteCardTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { templateId } = req.params;

      // Delete the template using the service
      await this.physicalCardService.deleteCardTemplate(templateId);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Card template deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  private createPhysicalCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        userId,
        cardId,
        templateId,
        primaryColor,
        secondaryColor,
        finalDesign,
      } = req.body;

      // Validate required fields
      if (
        !userId ||
        !cardId ||
        !templateId ||
        !primaryColor ||
        !secondaryColor
      ) {
        return next(new HttpException(400, "error", "Missing required fields"));
      }

      // Fetch template details
      const template = await this.physicalCardService.getTemplateById(
        templateId
      );
      if (!template) {
        return next(new HttpException(404, "error", "Template not found"));
      }

      // Call the service to create the physical card
      const physicalCard = await this.physicalCardService.createPhysicalCard(
        userId,
        cardId,
        templateId,
        primaryColor,
        secondaryColor,
        finalDesign
      );

      res.status(201).json({
        statusCode: 201,
        status: "success",
        payload: physicalCard,
      });
    } catch (error) {
      next(error);
    }
  };

  private createCustomPhysicalCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId, cardId, templateId, primaryColor, secondaryColor } =
        req.body;

      // Validate required fields
      if (
        !userId ||
        !cardId ||
        !templateId ||
        !primaryColor ||
        !secondaryColor
      ) {
        return next(new HttpException(400, "error", "Missing required fields"));
      }

      // Validate photo upload
      if (!req.file) {
        return next(new HttpException(400, "error", "Photo is required"));
      }

      // Fetch template details
      const template = await this.physicalCardService.getTemplateById(
        templateId
      );
      if (!template) {
        return next(new HttpException(404, "error", "Template not found"));
      }

      // Get photo path safely
      const photoPath = this.getPhotoUrl(req.file);

      // Create custom physical card
      const customCard =
        await this.physicalCardService.createCustomPhysicalCard(
          userId,
          cardId,
          templateId,
          primaryColor,
          secondaryColor,
          photoPath
        );

      res.status(201).json({
        statusCode: 201,
        status: "success",
        payload: customCard,
      });
    } catch (error) {
      next(error);
    }
  };

  // Utility function for getting the correct photo URL
  private getPhotoUrl(file: Express.Multer.File): string {
    return file.path; // Modify if using S3/Cloudinary
  }

  private getPhysicalCardById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;

      // Validate cardId
      if (!cardId) {
        return next(new HttpException(400, "error", "Card ID is required"));
      }

      const physicalCard = await this.physicalCardService.getPhysicalCardById(
        cardId
      );

      if (!physicalCard) {
        return next(new HttpException(404, "error", "Physical card not found"));
      }

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: physicalCard,
      });
    } catch (error) {
      next(error);
    }
  };

  private updatePhysicalCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;
      const { primaryColor, secondaryColor, finalDesign } = req.body;

      // Validate the required fields
      if (!cardId) {
        return next(new HttpException(400, "error", "Card ID is required"));
      }

      // Fetch the existing physical card to check if it exists
      const existingCard = await this.physicalCardService.getPhysicalCardById(
        cardId
      );
      if (!existingCard) {
        return next(new HttpException(404, "error", "Physical card not found"));
      }

      // Update the physical card with the provided data
      const updatedCard = await this.physicalCardService.updatePhysicalCard(
        cardId,
        primaryColor,
        secondaryColor,
        finalDesign
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: updatedCard,
      });
    } catch (error) {
      next(error);
    }
  };

  private deletePhysicalCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;

      // Validate the required field
      if (!cardId) {
        return next(new HttpException(400, "error", "Card ID is required"));
      }

      // Fetch the existing physical card to check if it exists
      const existingCard = await this.physicalCardService.getPhysicalCardById(
        cardId
      );
      if (!existingCard) {
        return next(new HttpException(404, "error", "Physical card not found"));
      }

      // Call the service to delete the physical card
      await this.physicalCardService.deletePhysicalCard(cardId);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Physical card deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default PhysicalCardController;
