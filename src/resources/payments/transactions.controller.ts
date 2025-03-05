import { NextFunction, Request, Response, Router } from "express";
import GeneralController from "../../protocols/global.controller";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import TransactionModel from "./transactions.model";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import { UserRole } from "../user/user.protocol";

class TransactionsController implements GeneralController {
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
  }

  private getTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { provider } = req.query; // Allows filtering by payment provider (optional)
      const filter = provider ? { paymentProvider: provider } : {};

      const transactions = await TransactionModel.find(filter).sort({
        createdAt: -1,
      });
      res.status(200).json({ status: "success", transactions });
    } catch (error) {
      next(error);
    }
  };
}

export default TransactionsController;
