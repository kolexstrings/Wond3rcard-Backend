import axios from "axios";
import { Request } from "express";
import useragent from "useragent";
import {
  Analytic,
  AnalyticsData,
  AnalyticUser,
  defaultGeoData,
  DeviceInfo,
  Geolocation,
  ResponseData,
} from "./analytic.protocol";
import AnalyticModel from "./analytics.model";

class AnalyticService {
  private async getGeolocation(ip: string): Promise<Geolocation | null> {
    try {
      const geoResponse = await axios.get<Geolocation>(
        `https://ipapi.co/${ip}/json/`
      );
      return geoResponse.data;
    } catch (error) {
      console.error("Error fetching geolocation:", error);
      return null;
    }
  }

  public async logAnalytic(req: Request): Promise<AnalyticsData | null> {
    try {
      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "";
      const userAgentString = req.headers["user-agent"] || "";
      const agent = useragent.parse(userAgentString);

      const deviceInfo: DeviceInfo = {
        browser: agent.toAgent(),
        os: agent.os.toString(),
        device: agent.device.toString(),
      };

      const geoData: Geolocation | null = await this.getGeolocation(ip);

      const analyticsData: AnalyticsData = {
        ipAddress: ip,
        geolocation: geoData,
        deviceInfo: deviceInfo,
        timestamp: new Date(),
      };

      const user = req.user;

      const analyticUser: AnalyticUser = {
        isWonderCardUser: user !== null && user !== undefined,
        uid: user ? user.id : "000000",
        fullName: user ? user.email : "Anonymous",
      };

      const responseData: ResponseData = {
        statusCode: 0,
        statusMessage: "",
        responseTime: 0,
        headers: {},
      };

      await this.saveToDatabase({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body || "",
        response: responseData,
        ipAddress: ip,
        geolocation: geoData || defaultGeoData,
        deviceInfo: deviceInfo,
        timestamp: new Date(),
        analyticUser: analyticUser,
      });

      return analyticsData;
    } catch (error) {
      console.error("Error logging analytics:", error);
      return null;
    }
  }

  private async saveToDatabase(analytic: Analytic): Promise<void> {
    try {
      const analyticDocument = new AnalyticModel(analytic);
      await analyticDocument.save();
      console.log("Analytics data saved successfully");
    } catch (error) {
      console.error("Error saving analytics data to MongoDB:", error);
    }
  }

  /** Get analytics insights */
  public async getAnalyticsSummary() {
    try {
      const totalVisits = await AnalyticModel.countDocuments();

      // Aggregate device type counts
      const deviceBreakdown = await AnalyticModel.aggregate([
        { $group: { _id: "$deviceInfo.device", count: { $sum: 1 } } },
      ]);

      // Aggregate browser counts
      const browserBreakdown = await AnalyticModel.aggregate([
        { $group: { _id: "$deviceInfo.browser", count: { $sum: 1 } } },
      ]);

      // Aggregate location counts
      const locationBreakdown = await AnalyticModel.aggregate([
        { $group: { _id: "$geolocation.country_name", count: { $sum: 1 } } },
      ]);

      return {
        totalVisits,
        deviceBreakdown: this.formatAggregation(deviceBreakdown),
        browserBreakdown: this.formatAggregation(browserBreakdown),
        locationBreakdown: this.formatAggregation(locationBreakdown),
      };
    } catch (error) {
      console.error("Error fetching analytics insights:", error);
      return null;
    }
  }

  private formatAggregation(data: { _id: string; count: number }[]) {
    return data.reduce((acc, entry) => {
      acc[entry._id || "Unknown"] = entry.count;
      return acc;
    }, {} as Record<string, number>);
  }
}

export default AnalyticService;
