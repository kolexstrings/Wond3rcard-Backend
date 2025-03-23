import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import GeneralController from "../../protocols/global.controller";
import PhysicalCardService from "./physical-card.service";
import multer from "multer";

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
    this.router.post(
      `${this.path}/order`,
      authenticatedMiddleware,
      this.orderPhysicalCard
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

      const { name, price } = req.body;
      const template = await this.physicalCardService.createCardTemplate(
        name,
        req.file.path,
        price
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

  private orderPhysicalCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, templateId, quantity, primaryColor, secondaryColor } =
        req.body;
      if (
        !cardId ||
        !templateId ||
        !quantity ||
        !primaryColor ||
        !secondaryColor
      ) {
        return next(new HttpException(400, "error", "Missing required fields"));
      }

      const order = await this.physicalCardService.orderPhysicalCard(
        req.user.id,
        cardId,
        templateId,
        quantity,
        primaryColor,
        secondaryColor
      );

      res.status(201).json({
        statusCode: 201,
        status: "success",
        payload: order,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default PhysicalCardController;
