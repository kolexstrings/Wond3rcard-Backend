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
    this.router.get(`${this.path}/`, [authenticatedMiddleware], this.analytics);
    this.router.get(`${this.path}/by-time-period`, [authenticatedMiddleware], this.analyticsByTimePeriod);
    this.router.get(`${this.path}/user-card-analytics`, [authenticatedMiddleware], this.fetchUserCardAnalytics);
    this.router.get(`${this.path}/geo-dist`, [authenticatedMiddleware], this.geoDistributions);

    this.router.post(
      `${this.path}/`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.interact),
      ],
      this.interact
    );

  }

  private analytics = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = req.user.id
      const analytics = await this.service.getAllUserCardsAnalytics(userId)
      return res.status(201).json({ status: "success", message: "Analytics retrieved successfully", payload: { analytics }, });
    } catch (error) {
      next(error);
    }
  }

  private fetchUserCardAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { error } = validator.validateGetUserSingleCard.validate(req.query);

      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const userId = req.user.id
      const { cardId } = req.query
      const analytics = await this.service.getUserCardAnalytics(userId, cardId as string)
      return res.status(201).json({ status: "success", message: "Analytics retrived successfully", payload: { analytics }, });
    } catch (error) {
      next(error);
    }
  }


  private analyticsByTimePeriod = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { timePeriod } = req.query
      const { error } = validator.validateTimePeriod.validate(req.query);

      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const userId = req.user.id
      const analytics = await this.service.getUserCardAnalyticsByTimePeriod(userId, timePeriod as string)
      return res.status(201).json({ status: "success", message: "Analytics retrived successfully", payload: { analytics }, });
    } catch (error) {
      next(error);
    }
  }

  private geoDistributions = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
    } catch (error) {
      next(error);
    }
  }

  private interact = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { cardId, interactor, interactionType, ipAddress, deviceInfo, cardOwnerId } = req.body
      const interaction = await this.service.saveAnalytics(cardId, interactor as Interactor, deviceInfo as DeviceInfo, interactionType, ipAddress, cardOwnerId)
      return res.status(201).json({ status: "success", message: "Analytics added successfully", payload: { interaction }, });
    } catch (error) {
      next(error);
    }
  };
}

export default InteractionController