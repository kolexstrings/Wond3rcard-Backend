import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../../exceptions/http.exception";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import GeneralController from "../../../protocols/global.controller";
import PaystackSubscriptionService from "./paystack.service";
import PaystackOrderService from "../../physical-card/order-physical-card/paystack/paystack.service";
import userModel from "../../user/user.model";
import validationMiddleware from "../../../middlewares/validation.middleware";
import {
  validateCancelSubscription,
  validateChangeSubscription,
  validatePaystackPayment,
  validateWebhookPayload,
} from "./paystack.validations";
import crypto from "crypto";

class PaystackController implements GeneralController {
  public path = "/paystack";
  public router = Router();
  private paystackSubscriptionService = new PaystackSubscriptionService();
  private paystackCardOrderService = new PaystackOrderService();

  constructor() {
    this.initializeRoute();
  }

  private initializeRoute(): void {
    this.router.post(
      `${this.path}/initialize-payment`,
      [authenticatedMiddleware, validationMiddleware(validatePaystackPayment)],
      this.initializePayment
    );

    this.router.post(
      `${this.path}/webhook`,
      validationMiddleware(validateWebhookPayload),
      this.handleWebhook
    );

    this.router.get(`${this.path}/verify/:reference`, this.verifyTransaction);

    this.router.post(
      `${this.path}/cancel-subscription`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateCancelSubscription),
      ],
      this.cancelSubscription
    );

    this.router.post(
      `${this.path}/change-subscription`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateChangeSubscription),
      ],
      this.changeSubscription
    );
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

      const result = await this.paystackSubscriptionService.initializePayment(
        userId,
        plan,
        billingCycle
      );

      if (result.type === "payment") {
        // User needs to make payment via checkout link
        res.status(200).json({
          statusCode: 200,
          status: "success",
          payload: {
            checkoutUrl: result.checkoutUrl,
            reference: result.reference,
          },
        });
      } else if (result.type === "subscription") {
        // Subscription already created using existing card
        res.status(200).json({
          statusCode: 200,
          status: "success",
          payload: {
            subscription: result.subscriptionData,
          },
        });
      } else {
        res.status(500).json({
          statusCode: 500,
          status: "error",
          message: "Unexpected response from payment service",
        });
      }
    } catch (error: any) {
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

      // Verify signature
      const secret = process.env.PAYSTACK_SECRET as string;
      const hash = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== paystackSignature) {
        return next(new HttpException(403, "error", "Invalid signature"));
      }

      const { event, data } = req.body;

      if (event === "charge.success") {
        try {
          const { metadata } = data;

          if (!metadata || !metadata.transactionType) {
            res.status(400).json({ message: "Missing transaction type" });
          }

          let result;

          switch (metadata.transactionType) {
            case "subscription":
              result =
                await this.paystackSubscriptionService.handleSuccessfulSubscription(
                  data
                );
              break;

            case "card_order":
              result =
                await this.paystackCardOrderService.handleSuccessfulCardOrder(
                  data
                );
              break;

            default:
              res.status(400).json({ message: "Unknown transaction type" });
          }

          res.status(200).json(result);
        } catch (error) {
          console.error("Error processing webhook:", error);
          res
            .status(200)
            .json({ message: "Webhook received but processing failed" });
        }
      } else {
        res.status(400).json({ message: "Unhandled event" });
      }
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Internal server error" });
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

      const verification =
        await this.paystackSubscriptionService.verifyTransaction(reference);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: verification.data,
      });
    } catch (error) {
      next(error);
    }
  };

  private cancelSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.body;

      const result = await this.paystackSubscriptionService.cancelSubscription(
        userId
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: result,
      });
    } catch (error) {
      next(error);
    }
  };

  private changeSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId, newPlan, billingCycle } = req.body;

      if (!["monthly", "yearly"].includes(billingCycle)) {
        return next(new HttpException(400, "error", "Invalid billing cycle"));
      }

      const result = await this.paystackSubscriptionService.changeSubscription(
        userId,
        newPlan,
        billingCycle
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default PaystackController;
