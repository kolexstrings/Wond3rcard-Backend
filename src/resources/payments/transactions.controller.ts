import { NextFunction, Request, Response, Router } from "express";
import GeneralController from "../../protocols/global.controller";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import TransactionModel from "./transactions.model";

class TransactionsController implements GeneralController {
  public path = "/transactions";
  public router = Router();

  constructor() {
    this.initializeRoute();
  }

  private initializeRoute() {
    this.router.get(
      `${this.path}`,
      authenticatedMiddleware,
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
