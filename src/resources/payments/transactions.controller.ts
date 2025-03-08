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
      const {
        provider,
        status,
        userId,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = req.query;

      const filter: any = {};
      if (provider) filter.paymentProvider = provider;
      if (status) filter.status = status;
      if (userId) filter.userId = userId;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }

      const transactions = await TransactionModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit);

      const totalTransactions = await TransactionModel.countDocuments(filter);

      res.status(200).json({
        status: "success",
        transactions,
        totalTransactions,
        totalPages: Math.ceil(totalTransactions / +limit),
        currentPage: +page,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default TransactionsController;
