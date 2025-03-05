import { Request, Response, Router } from "express";
import GeneralController from "../../protocols/global.controller";
import ZoomService from "./zoom.service";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";

class ZoomController implements GeneralController {
  public path = "/zoom";
  public router = Router();
  private zoomService = new ZoomService();

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
      const accessToken = await this.zoomService.getAccessToken(
        req.query.code as string
      );
      res.json({ message: "Zoom authenticated", accessToken });
    } catch (error) {
      res.status(400).json({ error: "OAuth Error" });
    }
  };

  private createMeeting = async (req: Request, res: Response) => {
    try {
      const { accessToken, topic, duration } = req.body;
      const meetingLink = await this.zoomService.createMeeting(
        accessToken,
        topic,
        duration
      );
      res.json({ meetingLink });
    } catch (error) {
      res.status(400).json({ error: "Failed to create meeting" });
    }
  };
}

export default ZoomController;
