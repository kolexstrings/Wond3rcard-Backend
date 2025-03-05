import { Request, Response, Router } from "express";
import GeneralController from "../../protocols/global.controller";
import TeamsService from "./teams.service";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";

class TeamsController implements GeneralController {
  public path = "/teams";
  public router = Router();
  private teamsService = new TeamsService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.get(
      `${this.path}/authorize`,
      [authenticatedMiddleware],
      this.authorize
    );

    this.router.get(`${this.path}/callback`, this.callback);

    this.router.post(
      `${this.path}/createMeeting`,
      [authenticatedMiddleware],
      this.createMeeting
    );
  }

  private authorize = async (req: Request, res: Response) => {
    res.redirect(TeamsService.getAuthUrl());
  };

  private callback = async (req: Request, res: Response) => {
    try {
      const accessToken = await this.teamsService.getAccessToken(
        req.query.code as string
      );
      res.json({ message: "Teams authenticated", accessToken });
    } catch (error) {
      res.status(400).json({ error: "OAuth Error" });
    }
  };

  private createMeeting = async (req: Request, res: Response) => {
    try {
      const { accessToken, topic, startTime, duration } = req.body;
      const meetingLink = await this.teamsService.createMeeting(
        accessToken,
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

export default TeamsController;
