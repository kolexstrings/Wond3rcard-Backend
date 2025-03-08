import { NextFunction, Request, Response, Router } from "express";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import { UserRole } from "../user/user.protocol";
import TransactionService from "./transactions.service";
import TransactionModel from "./transactions.model";

class TransactionsController {
  public path = "/payments";
  public router = Router();

  constructor() {
    this.initializeRoute();
  }

  private initializeRoute() {
    this.router.get(
      `${this.path}/transactions`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getTransactions
    );
    this.router.get(
      `${this.path}/analytics`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getAnalytics
    );
  }

  private async getTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { provider } = req.query;
      const filter = provider ? { paymentProvider: provider } : {};
      const transactions = await TransactionModel.find(filter).sort({
        createdAt: -1,
      });

      res.status(200).json({ status: "success", transactions });
    } catch (error) {
      next(error);
    }
  }

  private async getAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const analytics = await TransactionService.getTransactionAnalytics();
      res.status(200).json(analytics);
    } catch (error) {
      next(error);
    }
  }
}

export default TransactionsController;
