import { Request, Response, Router } from "express";
import GeneralController from "../../protocols/global.controller";
import ZoomService from "./zoom.service";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import TokenService from "../../services/token.service";

class ZoomController implements GeneralController {
  public path = "/zoom";
  public router = Router();
  private zoomService = new ZoomService();
  private tokenService = new TokenService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.get(
      `${this.path}/authorize`,
      [authenticatedMiddleware],
      this.authorize
    );

    this.router.get(
      `${this.path}/callback`,
      [authenticatedMiddleware],
      this.callback
    );

    this.router.post(
      `${this.path}/createMeeting`,
      [authenticatedMiddleware],
      this.createMeeting
    );
  }

  private authorize = async (req: Request, res: Response) => {
    res.redirect(ZoomService.getAuthUrl());
  };

  private callback = async (req: Request, res: Response) => {
    try {
      const { accessToken, refreshToken } =
        await this.zoomService.getAccessToken(req.query.code as string);

      await this.tokenService.storeToken(req.user.id, "zoom", {
        accessToken,
        refreshToken,
      });

      res.json({ message: "Zoom authenticated", accessToken });
    } catch (error) {
      res.status(400).json({ error: "OAuth Error" });
    }
  };

  private createMeeting = async (req: Request, res: Response) => {
    try {
      let storedToken = await this.tokenService.getToken(req.user.id, "zoom");
      if (!storedToken) {
        return res.status(401).json({ error: "No Zoom token found" });
      }

      // Check if access token is expired and refresh if needed
      try {
        await this.zoomService.createMeeting(
          storedToken.accessToken,
          req.body.topic,
          req.body.duration
        );
      } catch (error) {
        if (error.response?.status === 401) {
          // Token expired, refresh it
          const newAccessToken = await this.zoomService.refreshAccessToken(
            storedToken.refreshToken
          );

          // Update token in the database
          await this.tokenService.storeToken(req.user.id, "zoom", {
            accessToken: newAccessToken,
            refreshToken: storedToken.refreshToken, // Keep the same refresh token
          });

          // Retry creating the meeting
          const meetingLink = await this.zoomService.createMeeting(
            newAccessToken,
            req.body.topic,
            req.body.duration
          );
          return res.json({ meetingLink });
        }
        throw error;
      }

      res.json({ message: "Meeting created successfully" });
    } catch (error) {
      res.status(400).json({ error: "Failed to create meeting" });
    }
  };
}

export default ZoomController;
