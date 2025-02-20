import axios from "axios";
import { Request } from "express";
import useragent from "useragent";
import { Analytic, AnalyticsData, AnalyticUser, defaultGeoData, DeviceInfo, Geolocation, ResponseData } from "./analytic.protocol"; // Adjust the path as necessary
import AnalyticModel from "./analytics.model";

class AnalyticService {
  private async getGeolocation(ip: string): Promise<Geolocation | null> {
    try {
      const geoResponse = await axios.get<Geolocation>(`https://ipapi.co/${ip}/json/`);
      const geolocationData = geoResponse.data;
      return geolocationData;
    } catch (error) {
      console.error("Error fetching geolocation:", error);
      return null;
    }
  }

  public async logAnalytic(req: Request): Promise<AnalyticsData | null> {
    try {
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";

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
        isWonderCardUser: (user !== null && user !== undefined) ? true : false,
        uid: (user !== null && user !== undefined) ? user.id : '000000',
        fullName: (user !== null && user !== undefined) ? user.email : 'Anonymous',
      };

      const responseData: ResponseData = {
        statusCode: 0,
        statusMessage: "",
        responseTime: 0,
        headers: {}
      }

      await this.saveToDatabase({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body || '',
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
}

export default AnalyticService;
