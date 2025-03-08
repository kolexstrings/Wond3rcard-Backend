import TransactionModel from "./transactions.model";

class TransactionService {
  public async getTransactionAnalytics() {
    try {
      const totalRevenue = await TransactionModel.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const failedTransactions = await TransactionModel.countDocuments({
        status: "failed",
      });
      const successfulTransactions = await TransactionModel.countDocuments({
        status: "success",
      });
      const pendingTransactions = await TransactionModel.countDocuments({
        status: "pending",
      });

      const revenueByProvider = await TransactionModel.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: "$paymentProvider", total: { $sum: "$amount" } } },
      ]);

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

      const totalTransactions =
        successfulTransactions + failedTransactions + pendingTransactions;
      const failureRate = totalTransactions
        ? ((failedTransactions / totalTransactions) * 100).toFixed(2)
        : "0";

      const commonPaymentMethod = await TransactionModel.aggregate([
        { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]);

      const usersByTier = await TransactionModel.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: "$plan", count: { $sum: 1 } } },
      ]);

      return {
        totalRevenue: totalRevenue[0]?.total || 0,
        failedTransactions,
        successfulTransactions,
        pendingTransactions,
        revenueByProvider,
        revenueByMonth,
        failureRate: `${failureRate}%`,
        mostCommonPaymentMethod: commonPaymentMethod[0]?._id || "N/A",
        usersByTier,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new TransactionService();
