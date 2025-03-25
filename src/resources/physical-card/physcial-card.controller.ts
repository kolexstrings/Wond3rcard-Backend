import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import GeneralController from "../../protocols/global.controller";
import PhysicalCardService from "./physical-card.service";
import multer from "multer";
import { parsePrice } from "../../utils/parsePrice";

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
      const { userId, cardId, templateId, primaryColor, secondaryColor, svg } =
        req.body;

      // Validate required fields
      if (
        !userId ||
        !cardId ||
        !templateId ||
        !primaryColor ||
        !secondaryColor ||
        !svg
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
        template.name,
        template.priceNaira,
        template.priceUsd,
        primaryColor,
        secondaryColor,
        svg
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

      if (
        !userId ||
        !cardId ||
        !templateId ||
        !primaryColor ||
        !secondaryColor
      ) {
        return next(new HttpException(400, "error", "Missing required fields"));
      }

      if (!req.file) {
        return next(new HttpException(400, "error", "Photo is required"));
      }

      const photoPath = req.file.path;

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
}

export default PhysicalCardController;
