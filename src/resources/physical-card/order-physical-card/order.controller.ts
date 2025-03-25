import { Request, Response, NextFunction, Router } from "express";
import HttpException from "../../../exceptions/http.exception";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import GeneralController from "../../../protocols/global.controller";
import PhysicalCardOrderService from "./order.service";

class PhysicalCardOrderController implements GeneralController {
  public path = "/card-orders";
  public router = Router();
  private physicalCardOrderService = new PhysicalCardOrderService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.post(
      `${this.path}/create`,
      authenticatedMiddleware,
      this.createOrder
    );
  }

  private createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        userId,
        physicalCardId,
        cardTemplateId,
        quantity,
        region,
        address,
      } = req.body;

      // Validate required fields
      if (
        !userId ||
        !physicalCardId ||
        !cardTemplateId ||
        !quantity ||
        !region ||
        !address
      ) {
        res.status(400).json({
          statusCode: 400,
          status: "error",
          message: "Missing required fields",
        });
      }

      // Create order
      const order = await this.physicalCardOrderService.createOrder(
        userId,
        physicalCardId,
        cardTemplateId,
        quantity,
        region,
        address
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

export default PhysicalCardOrderController;
