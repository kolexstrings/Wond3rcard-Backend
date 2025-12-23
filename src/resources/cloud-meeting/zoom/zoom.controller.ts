import { Request, Response, Router } from "express";
import GeneralController from "../../../protocols/global.controller";
import ZoomService from "./zoom.service";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import TokenService from "../token.service";

class ZoomController implements GeneralController {
  public path = "/zoom";
  public router = Router();
  private zoomService = new ZoomService();
  private tokenService = new TokenService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    /**
     * @openapi
     * /api/zoom/authorize:
     *   get:
     *     tags: [zoom]
     *     summary: Authorize Zoom integration
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       302:
     *         description: Redirect to Zoom OAuth
     */
    this.router.get(
      `${this.path}/authorize`,
      [authenticatedMiddleware],
      this.authorize
    );

    /**
     * @openapi
     * /api/zoom/callback:
     *   get:
     *     tags: [zoom]
     *     summary: Handle Zoom OAuth callback
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: code
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Authentication successful
     */
    this.router.get(
      `${this.path}/callback`,
      [authenticatedMiddleware],
      this.callback
    );

    /**
     * @openapi
     * /api/zoom/createMeeting:
     *   post:
     *     tags: [zoom]
     *     summary: Create a Zoom meeting
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [topic, duration]
     *             properties:
     *               topic:
     *                 type: string
     *               duration:
     *                 type: number
     *     responses:
     *       200:
     *         description: Meeting created
     */
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
      const tokenResponse = await this.zoomService.getAccessToken(
        req.query.code as string
      );
      console.log("Zoom Token Response:", tokenResponse); // Debugging log

      const { accessToken, refreshToken, expires_in } = tokenResponse;

      await this.tokenService.saveToken(
        req.user.id,
        "zoom",
        accessToken,
        refreshToken,
        expires_in || 3600 // Default to 1 hour if missing
      );

      res.json({ message: "Zoom authenticated", accessToken });
    } catch (error) {
      console.error("OAuth Error:", error);
      res.status(400).json({ error: "OAuth Error" });
    }
  };

  private createMeeting = async (req: Request, res: Response) => {
    try {
      let storedToken = await this.tokenService.getToken(req.user.id, "zoom");
      if (!storedToken) {
        return res.status(401).json({ error: "No Zoom token found" });
      }

      let accessToken = storedToken.accessToken;
      let meetingLink;

      try {
        meetingLink = await this.zoomService.createMeeting(
          accessToken,
          req.body.topic,
          req.body.duration
        );
      } catch (error) {
        if (error.response?.status === 401) {
          // Refresh token if expired
          const newAccessToken = await this.zoomService.refreshAccessToken(
            storedToken.refreshToken
          );

          await this.tokenService.saveToken(
            req.user.id,
            "zoom",
            newAccessToken,
            storedToken.refreshToken,
            3600 // Default expiration or fetch actual expires_in
          );

          meetingLink = await this.zoomService.createMeeting(
            newAccessToken,
            req.body.topic,
            req.body.duration
          );
        } else {
          throw error;
        }
      }

      res.json({ meetingLink });
    } catch (error) {
      res.status(500).json({ error: "Error creating meeting" });
    }
  };
}

export default ZoomController;
