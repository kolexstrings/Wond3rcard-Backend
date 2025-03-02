import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../../exceptions/http.exception";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import GeneralController from "../../../protocols/global.controller";
import PaystackService from "./paystack.service";
import userModel from "../../user/user.model";
import validationMiddleware from "../../../middlewares/validation.middleware";
import {
  validateInitializePayment,
  validateWebhookPayload,
} from "./paystack.validations";

class PaystackController implements GeneralController {
  public path = "/paystack";
  public router = Router();
  private paystackService = new PaystackService();

  constructor() {
    this.initializeRoute();
  }

  private initializeRoute(): void {
    this.router.post(
      `${this.path}/initialize-payment`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateInitializePayment),
      ],
      this.initializePayment
    );

    this.router.post(
      `${this.path}/webhook`,
      validationMiddleware(validateWebhookPayload),
      this.handleWebhook
    );

    this.router.get(`${this.path}/verify/:reference`, this.verifyTransaction);
  }

  private initializePayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId, plan, billingCycle } = req.body;

      if (!["monthly", "yearly"].includes(billingCycle)) {
        return next(new HttpException(400, "error", "Invalid billing cycle"));
      }

      const user = await userModel.findById(userId);
      if (!user) return next(new HttpException(404, "error", "User not found"));

      const checkout = await this.paystackService.initializePayment(
        userId,
        plan,
        billingCycle
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: {
          checkoutUrl: checkout.data.authorization_url,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  private handleWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const paystackSignature = req.headers["x-paystack-signature"];
      if (!paystackSignature) {
        return next(new HttpException(401, "error", "Unauthorized"));
      }

      const { event, data } = req.body;
      if (event === "charge.success") {
        const { userId, plan, billingCycle, durationInDays } = data.metadata;
        const transactionId = data.id;

        const user = await userModel.findById(userId);
        if (!user)
          return next(new HttpException(404, "error", "User not found"));

        user.userTier = {
          plan,
          status: "active",
          transactionId,
          expiresAt: new Date(
            Date.now() + durationInDays * 24 * 60 * 60 * 1000
          ),
        };

        await user.save();
        res.status(200).json({ message: "Subscription activated" });
        return;
      }

      res.status(400).json({ message: "Unhandled event" });
    } catch (error) {
      next(error);
    }
  };

  private verifyTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { reference } = req.params;
      if (!reference) {
        return next(
          new HttpException(400, "error", "Transaction reference is required")
        );
      }

      const verification = await this.paystackService.verifyTransaction(
        reference
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: verification.data,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default PaystackController;
