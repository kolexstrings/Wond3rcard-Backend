import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import GeneralController from "../../protocols/global.controller";
import SubscriptionService from "./subscription.service";

class SubscriptionController implements GeneralController {
  public path = "/subscriptions";
  public router = Router();
  private subscriptionService = new SubscriptionService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/tiers`, this.getPublicTiers);
  }

  private getPublicTiers = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tiers = await this.subscriptionService.getPublicTiers();
      res.status(200).json({
        status: "success",
        message: "Available subscription tiers",
        payload: tiers,
      });
    } catch (error) {
      next(
        new HttpException(
          500,
          "internal_server_error",
          error instanceof Error ? error.message : "Failed to fetch tiers"
        )
      );
    }
  };
}

export default SubscriptionController;
