import { Request, Response, Router } from "express";
import GeneralController from "../../protocols/global.controller";
import AnalyticService from "./analytics.service";

class AnalyticsController implements GeneralController {
  public path = "analytics";
  public router = Router();
  private analyticsService = new AnalyticService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.post(`${this.path}/log`, this.logAnalytics.bind(this));
  }

  public async logAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      // Extract backend-detectable data
      const analyticsData = {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        referer: req.headers["referer"] || "Direct",
        language: req.headers["accept-language"],
        timestamp: new Date().toISOString(),

        // Include any additional data sent by the frontend
        ...req.body,
      };

      // Log or save this data
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
  }
}

export default AnalyticsController;
