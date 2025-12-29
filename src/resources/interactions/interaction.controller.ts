import { NextFunction, Request, Response, Router } from "express";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GeneralController from "../../protocols/global.controller";
import { DeviceInfo, Interactor } from "./interaction.protocol";
import InteractionService from "./interaction.service";
import validator from "./interaction.validator";

class InteractionController implements GeneralController {
  public path = "/interaction";
  public router = Router();
  private service = new InteractionService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    /**
     * @openapi
     * /api/interaction/:
     *   get:
     *     tags: [interactions]
     *     summary: Get all user card analytics
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       201:
     *         description: Analytics retrieved
     */
    this.router.get(`${this.path}/`, [authenticatedMiddleware], this.analytics);

    /**
     * @openapi
     * /api/interaction/by-time-period:
     *   get:
     *     tags: [interactions]
     *     summary: Get analytics by time period
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: timePeriod
     *         schema:
     *           type: string
     *     responses:
     *       201:
     *         description: Analytics retrieved
     */
    this.router.get(
      `${this.path}/by-time-period`,
      [authenticatedMiddleware],
      this.analyticsByTimePeriod
    );

    /**
     * @openapi
     * /api/interaction/user-card-analytics:
     *   get:
     *     tags: [interactions]
     *     summary: Get analytics for a specific user card
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: cardId
     *         schema:
     *           type: string
     *     responses:
     *       201:
     *         description: Card analytics retrieved
     */
    this.router.get(
      `${this.path}/user-card-analytics`,
      [authenticatedMiddleware],
      this.fetchUserCardAnalytics
    );

    /**
     * @openapi
     * /api/interaction/geo-dist:
     *   get:
     *     tags: [interactions]
     *     summary: Get geographic distribution of interactions
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Geographic distribution retrieved
     */
    this.router.get(
      `${this.path}/geo-dist`,
      [authenticatedMiddleware],
      this.geoDistributions
    );

    /**
     * @openapi
     * /api/interaction/:
     *   post:
     *     tags: [interactions]
     *     summary: Record a card interaction
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Interaction'
     *     responses:
     *       201:
     *         description: Interaction recorded
     */
    this.router.post(
      `${this.path}/`,
      [authenticatedMiddleware, validationMiddleware(validator.interact)],
      this.interact
    );
  }

  private analytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user.id;
      const analytics = await this.service.getAllUserCardsAnalytics(userId);
      res.status(201).json({
        status: "success",
        message: "Analytics retrieved successfully",
        payload: { analytics },
      });
    } catch (error) {
      next(error);
    }
  };

  private fetchUserCardAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { error } = validator.validateGetUserSingleCard.validate(req.query);

      if (error) {
        res.status(400).json({ error: error.details[0].message });
      }

      const userId = req.user.id;
      const { cardId } = req.query;
      const analytics = await this.service.getUserCardAnalytics(
        userId,
        cardId as string
      );
      res.status(201).json({
        status: "success",
        message: "Analytics retrieved successfully",
        payload: { analytics },
      });
    } catch (error) {
      next(error);
    }
  };

  private analyticsByTimePeriod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { timePeriod } = req.query;
      const { error } = validator.validateTimePeriod.validate(req.query);

      if (error) {
        res.status(400).json({ error: error.details[0].message });
      }

      const userId = req.user.id;
      const analytics = await this.service.getUserCardAnalyticsByTimePeriod(
        userId,
        timePeriod as string
      );
      res.status(201).json({
        status: "success",
        message: "Analytics retrieved successfully",
        payload: { analytics },
      });
    } catch (error) {
      next(error);
    }
  };

  private geoDistributions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
    } catch (error) {
      next(error);
    }
  };

  private interact = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        cardId,
        interactor,
        interactionType,
        ipAddress,
        deviceInfo,
        cardOwnerId,
      } = req.body;
      const interaction = await this.service.saveAnalytics(
        cardId,
        interactor as Interactor,
        deviceInfo as DeviceInfo,
        interactionType,
        ipAddress,
        cardOwnerId
      );
      res.status(201).json({
        status: "success",
        message: "Analytics added successfully",
        payload: { interaction },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default InteractionController;
