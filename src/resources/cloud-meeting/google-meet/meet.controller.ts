import { Request, Response, Router } from "express";
import GeneralController from "../../../protocols/global.controller";
import GoogleMeetService from "./meet.service";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";

class GoogleMeetController implements GeneralController {
  public path = "/google-meet";
  public router = Router();
  private googleMeetService = new GoogleMeetService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.get(
      `${this.path}/authorize`,
      authenticatedMiddleware,
      this.authorize
    );
    this.router.get(
      `${this.path}/callback`,
      authenticatedMiddleware,
      this.callback
    );
    this.router.post(
      `${this.path}/createMeeting`,
      authenticatedMiddleware,
      this.createMeeting
    );
  }

  private authorize = async (req: Request, res: Response) => {
    const authUrl = await this.googleMeetService.getAuthUrl();
    // res.json({ authUrl }); // for testing on postman
    res.redirect(await this.googleMeetService.getAuthUrl()); // for use on the browser
  };

  private callback = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const accessToken = await this.googleMeetService.getAccessToken(
        userId,
        req.query.code as string
      );
      res.json({ message: "Google Meet authenticated", accessToken });
    } catch (error) {
      res.status(400).json({ error: "OAuth Error" });
    }
  };

  private createMeeting = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { topic, startTime, duration } = req.body;
      const meetingLink = await this.googleMeetService.createMeeting(
        userId,
        topic,
        startTime,
        duration
      );
      res.json({ meetingLink });
    } catch (error) {
      res.status(400).json({ error: "Failed to create meeting" });
    }
  };
}

export default GoogleMeetController;
