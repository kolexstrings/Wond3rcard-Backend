import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import GeneralController from "../../protocols/global.controller";
import PhysicalCardService from "./physical-card.service";
import multer from "multer";
import { parsePrice } from "../../utils/parsePrice";
import { template } from "lodash";

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
      authenticatedMiddleware,
      upload.single("svg"),
      this.createTemplate
    );

    this.router.get(`${this.path}/templates`, this.getTemplates);

    this.router.get(`${this.path}/template/:templateId`, this.getTemplateById);

    this.router.post(
      `${this.path}/create-physical-card`,
      authenticatedMiddleware,
      this.createPhysicalCard
    );

    this.router.post(
      `${this.path}/create-custom`,
      authenticatedMiddleware,
      upload.single("photo"),
      this.createCustomPhysicalCard
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
}

export default PhysicalCardController;
