import { Request, Response, Router } from "express";
import GeneralController from "../../protocols/global.controller";
import AnalyticService from "./analytics.service";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import { UserRole } from "../user/user.protocol";

class AnalyticsController implements GeneralController {
  public path = "/analytics";
  public router = Router();
  private analyticsService = new AnalyticService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    /**
     * @openapi
     * /api/analytics/log:
     *   post:
     *     tags: [analytics]
     *     summary: Log analytics data
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LogAnalytics'
     *     responses:
     *       200:
     *         description: Analytics logged
     */
    this.router.post(`${this.path}/log`, this.logAnalytics);

    /**
     * @openapi
     * /api/analytics/insights:
     *   get:
     *     tags: [analytics]
     *     summary: Get analytics insights (Admin only)
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Insights retrieved
     */
    this.router.get(
      `${this.path}/insights`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getAnalyticsInsights
    );
  }

  private logAnalytics = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const analyticsData = {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        referer: req.headers["referer"] || "Direct",
        language: req.headers["accept-language"],
        timestamp: new Date().toISOString(),
        ...req.body,
      };

      const savedAnalytics = await this.analyticsService.logAnalytic(
        analyticsData
      );

      if (!savedAnalytics) {
        return res.status(500).json({ message: "Failed to log analytics" });
      }

      return res.status(200).json({
        message: "Analytics logged successfully",
        data: savedAnalytics,
      });
    } catch (error) {
      console.error("Error logging analytics:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  private getAnalyticsInsights = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      console.log("Analytics Insights API hit");
      const insights = await this.analyticsService.getAnalyticsSummary();
      console.log("Insights fetched:", insights);
      return res.status(200).json({
        message: "Analytics insights retrieved successfully",
        data: insights,
      });
    } catch (error) {
      console.error("Error fetching analytics insights:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
}

export default AnalyticsController;
