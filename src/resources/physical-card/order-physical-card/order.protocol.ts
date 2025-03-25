import { Request, Response, NextFunction, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import GeneralController from "../../protocols/global.controller";
import PhysicalCardOrderService from "./physical-card-order.service";

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
      const { userId, cardId, quantity, region } = req.body;

      if (!userId || !cardId || !quantity || !region) {
        return next(new HttpException(400, "error", "Missing required fields"));
      }

      const order = await this.physicalCardOrderService.createOrder(
        userId,
        cardId,
        quantity,
        region
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
