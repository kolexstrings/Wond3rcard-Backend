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

    this.router.get(
      `${this.path}/analytics`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getTransactionAnalytics
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

  private getTransactionAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get total revenue
      const totalRevenue = await TransactionModel.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      // Count failed transactions
      const failedTransactions = await TransactionModel.countDocuments({
        status: "failed",
      });

      // Count successful transactions
      const successfulTransactions = await TransactionModel.countDocuments({
        status: "success",
      });

      // Count pending transactions
      const pendingTransactions = await TransactionModel.countDocuments({
        status: "pending",
      });

      // Revenue breakdown by provider
      const revenueByProvider = await TransactionModel.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: "$paymentProvider", total: { $sum: "$amount" } } },
      ]);

      // Revenue over time (grouped by month)
      const revenueByMonth = await TransactionModel.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Failure rate percentage
      const totalTransactions =
        successfulTransactions + failedTransactions + pendingTransactions;
      const failureRate = totalTransactions
        ? ((failedTransactions / totalTransactions) * 100).toFixed(2)
        : "0";

      // Most common payment method
      const commonPaymentMethod = await TransactionModel.aggregate([
        { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]);

      res.status(200).json({
        totalRevenue: totalRevenue[0]?.total || 0,
        failedTransactions,
        successfulTransactions,
        pendingTransactions,
        revenueByProvider,
        revenueByMonth,
        failureRate: `${failureRate}%`,
        mostCommonPaymentMethod: commonPaymentMethod[0]?._id || "N/A",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default TransactionsController;
