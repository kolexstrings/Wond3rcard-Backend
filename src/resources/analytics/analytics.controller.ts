import { Request, Response, Router } from "express";
import GeneralController from "../../protocols/global.controller";
import AnalyticService from "./analytics.service";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import { validateChangeUserRole } from "../admin/admin.validation";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import { UserRole } from "../user/user.protocol";

class AnalyticsController implements GeneralController {
  public path = "analytics";
  public router = Router();
  private analyticsService = new AnalyticService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.post(
      `${this.path}/log`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.logAnalytics
    );
  }

  public async logAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      const analyticsData = await this.analyticsService.logAnalytic(req);

      if (!analyticsData) {
        return res.status(500).json({ message: "Failed to log analytics" });
      }

      return res.status(200).json({
        message: "Analytics logged successfully",
        data: analyticsData,
      });
    } catch (error) {
      console.error("Error logging analytics:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

export default AnalyticsController;
