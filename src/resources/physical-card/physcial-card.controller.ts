import { NextFunction, Request, Response, Router } from "express";
import path from "path";
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
// import { uploadCardTemplateMiddleware } from "../../multer-config/card-templates";
// import { uploadPhysicalCardMiddleware } from "../../multer-config/physical-cards";
import { createUploader } from "../../middlewares/uploadToCloudinary";

const uploadCardTemplateMiddleware = createUploader({
  folder: "card-templates",
  allowedFormats: ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"],
  fileSizeLimitMB: 5,
});

const uploadPhysicalCardMiddleware = createUploader({
  folder: "physical-cards",
  allowedFormats: ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"],
  fileSizeLimitMB: 5,
});

class PhysicalCardController implements GeneralController {
  public path = "/phy-cards";
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
        uploadCardTemplateMiddleware.single("svg"),
        validationMiddleware(validate.validateCardTemplate),
      ],
      this.createTemplate
    );

    this.router.post(
      `${this.path}/create-custom-template`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validate.validateCardTemplate),
      ],
      this.createCustomTemplate
    );

    this.router.get(
      `${this.path}/templates`,
      authenticatedMiddleware,
      this.getTemplates
    );

    this.router.get(
      `${this.path}/template/:templateId`,
      [authenticatedMiddleware],
      this.getTemplateById
    );

    this.router.put(
      `${this.path}/update-card-template/:templateId`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        uploadCardTemplateMiddleware.single("svg"),
      ],
      this.updateCardTemplate
    );

    this.router.put(
      `${this.path}/update-custom-card-template/:templateId`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        // uploadCardTemplateMiddleware,
      ],
      this.updateCustomCardTemplate
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
        validationMiddleware(validate.validatePhysicalCard),
      ],
      this.createPhysicalCard
    );

    this.router.post(
      `${this.path}/create-custom`,
      [
        authenticatedMiddleware,
        uploadPhysicalCardMiddleware.single("finalDesign"),
        validationMiddleware(validate.validateCustomPhysicalCard),
      ],
      this.createCustomPhysicalCard
    );

    this.router.get(
      `${this.path}/physical-cards`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getAllPhysicalCards
    );

    this.router.get(
      `${this.path}/physical/:userId`,
      authenticatedMiddleware,
      this.getUserPhysicalCards
    );

    this.router.get(
      `${this.path}/physical/:cardId`,
      [authenticatedMiddleware],
      this.getPhysicalCardById
    );

    this.router.put(
      `${this.path}/update-physical-card/:cardId`,
      authenticatedMiddleware,
      validationMiddleware(validate.validatePhysicalCardUpdate),
      this.updatePhysicalCard
    );

    this.router.put(
      `${this.path}/update-custom-physical-card/:cardId`,
      [
        authenticatedMiddleware,
        uploadPhysicalCardMiddleware.single("finalDesign"),
      ],
      this.updateCustomPhysicalCard
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

      console.log("Uploaded file details:", req.file);
      console.log("Request body:", req.body);
      console.log("Authenticated user:", req.user);

      const { name, priceNaira, priceUsd } = req.body;

      if (!req.user || !req.user.id) {
        return next(new HttpException(401, "error", "User not authenticated"));
      }

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
        parsedPriceUsd,
        req.user.id
      );

      console.log("Template created successfully:", template);

      res.status(201).json({
        statusCode: 201,
        status: "success",
        payload: template,
      });
    } catch (error) {
      console.error("Unexpected error in createTemplate:", error);
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

      console.log("Template Id: ", templateId);

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

  // Define the update card template route
  private updateCardTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { templateId } = req.params;
      const { name, priceNaira, priceUsd } = req.body;

      // Validate required fields (file is mandatory for design)
      if (!name && !priceNaira && !priceUsd && !req.file) {
        return next(
          new HttpException(400, "error", "No fields or file to update")
        );
      }

      // Call service method to handle the update
      const updatedTemplate = await this.physicalCardService.updateCardTemplate(
        templateId,
        name,
        priceNaira,
        priceUsd,
        req.file
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: updatedTemplate,
      });
    } catch (error) {
      console.error("Error creating card template:", error);
      next(error);
    }
  };

  private createCustomTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, priceNaira, priceUsd } = req.body;

      if (!req.user || !req.user.id) {
        return next(new HttpException(401, "error", "User not authenticated"));
      }

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

      // No file needed, so design can be null or an empty string
      const template = await this.physicalCardService.createCardTemplate(
        name,
        "", // No SVG file
        parsedPriceNaira,
        parsedPriceUsd,
        req.user.id
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

  private updateCustomCardTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { templateId } = req.params;
      const { name, priceNaira, priceUsd } = req.body;

      if (!name && !priceNaira && !priceUsd) {
        return next(new HttpException(400, "error", "No fields to update"));
      }

      let parsedPriceNaira: number | undefined;
      if (priceNaira) {
        try {
          parsedPriceNaira = parsePrice(priceNaira);
        } catch (error) {
          return next(error);
        }
      }

      let parsedPriceUsd: number | undefined;
      if (priceUsd) {
        try {
          parsedPriceUsd = parsePrice(priceUsd);
        } catch (error) {
          return next(error);
        }
      }

      const updatedTemplate = await this.physicalCardService.updateCardTemplate(
        templateId,
        name,
        parsedPriceNaira,
        parsedPriceUsd,
        undefined // we don't need svg here
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
        !secondaryColor ||
        !finalDesign
      ) {
        return next(new HttpException(400, "error", "Missing required fields"));
      }

      // Ensure finalDesign is a valid SVG string
      if (!finalDesign.startsWith("<svg")) {
        return next(
          new HttpException(400, "error", "Invalid SVG design format")
        );
      }

      // Fetch template details
      const template = await this.physicalCardService.getTemplateById(
        templateId
      );
      if (!template) {
        return next(new HttpException(404, "error", "Template not found"));
      }

      // Create physical card
      const physicalCard = await this.physicalCardService.createPhysicalCard(
        userId,
        cardId,
        templateId,
        finalDesign,
        primaryColor,
        secondaryColor
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

      // Validate image upload for custom card
      if (
        !req.file ||
        ![".png", ".jpg", ".jpeg"].includes(
          path.extname(req.file.originalname).toLowerCase()
        )
      ) {
        return next(
          new HttpException(
            400,
            "error",
            "Valid PNG/JPG/JPEG file is required for custom card"
          )
        );
      }

      // Fetch template details
      const template = await this.physicalCardService.getTemplateById(
        templateId
      );
      if (!template) {
        return next(new HttpException(404, "error", "Template not found"));
      }

      // Get the photo path (from Multer storage)
      const photoPath = req.file.path; // Multer stores the file in the 'path' field

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

  public getAllPhysicalCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const physicalCards =
        await this.physicalCardService.getAllPhysicalCards();
      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: physicalCards,
      });
    } catch (error) {
      next(error);
    }
  };

  public getUserPhysicalCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return next(new HttpException(400, "error", "User ID is required"));
      }

      const userCards = await this.physicalCardService.getUserPhysicalCards(
        userId
      );
      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: userCards,
      });
    } catch (error) {
      next(error);
    }
  };

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

      if (!cardId) {
        return next(new HttpException(400, "error", "Card ID is required"));
      }

      const existingCard = await this.physicalCardService.getPhysicalCardById(
        cardId
      );
      if (!existingCard) {
        return next(new HttpException(404, "error", "Physical card not found"));
      }

      // Validate finalDesign as an SVG string (if provided)
      if (
        finalDesign &&
        (!finalDesign.startsWith("<svg") || !finalDesign.endsWith("</svg>"))
      ) {
        return next(new HttpException(400, "error", "Invalid SVG format"));
      }

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

  private updateCustomPhysicalCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;
      const { primaryColor, secondaryColor } = req.body;
      const file = req.file; // File upload (JPG, PNG, or JPEG)

      if (!cardId) {
        return next(new HttpException(400, "error", "Card ID is required"));
      }

      const existingCard = await this.physicalCardService.getPhysicalCardById(
        cardId
      );
      if (!existingCard) {
        return next(
          new HttpException(404, "error", "Custom physical card not found")
        );
      }

      // Ensure a file is uploaded and check if it's an image
      if (!file) {
        return next(
          new HttpException(
            400,
            "error",
            "Image file (JPG, PNG, JPEG) is required"
          )
        );
      }

      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.mimetype)) {
        return next(
          new HttpException(
            400,
            "error",
            "Invalid file format. Only JPG, PNG, and JPEG are allowed"
          )
        );
      }

      // Update the card with the new image file path
      const updatedCard =
        await this.physicalCardService.updateCustomPhysicalCard(
          cardId,
          primaryColor,
          secondaryColor,
          file.path // Save the uploaded image path
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

      if (!cardId) {
        return next(new HttpException(400, "error", "Card ID is required"));
      }

      const existingCard = await this.physicalCardService.getPhysicalCardById(
        cardId
      );
      if (!existingCard) {
        return next(new HttpException(404, "error", "Physical card not found"));
      }

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
