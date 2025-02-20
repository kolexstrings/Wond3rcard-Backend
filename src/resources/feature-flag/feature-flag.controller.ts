import { NextFunction, Request, Response, Router } from "express";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GlobalController from '../../protocols/global.controller';
import validate from "../../resources/feature-flag/feature-flags.validation";
import FeatureFlagService from "./feature-flag.service";

class FeatureFlagsController implements GlobalController {
  public path = '/feature-flags';
  public router = Router()

  private featureService: FeatureFlagService = new FeatureFlagService()

  constructor() {

    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}`,
      this.listFeatureFlags,
    )

    this.router.post(`${this.path}/create-feature`,
      [validationMiddleware(validate.validateCreateFeature), authenticatedMiddleware, verifyRolesMiddleware(['admin'])],
      this.createFeatureFlag,
    )

    this.router.post(`${this.path}/get-feature`,
      [validationMiddleware(validate.validateGetFeatureFlag)],
      this.getFeatureFlag,
    )

    this.router.post(`${this.path}/update-feature`,
      [validationMiddleware(validate.validateUpdateFeature), authenticatedMiddleware, verifyRolesMiddleware(['admin'])],
      this.updateFeatureFlag,
    )

    this.router.post(`${this.path}/delete-feature`,
      [validationMiddleware(validate.validateDeleteFeatureFlag), authenticatedMiddleware, verifyRolesMiddleware(['admin'])],
      this.deleteFeatureFlag,
    )

  }

  private createFeatureFlag = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const featureFlag = await this.featureService.createFeatureFlag(req.body);
      res.status(201).json(featureFlag);
    } catch (error) {
      res.status(500).json({ status: 'failed', message: "Failed to create feature flag" });
    }
  }

  private getFeatureFlag = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { featureName } = req.body
      const featureFlag = await this.featureService.getFeatureFlag(featureName);
      if (featureFlag) {
        res.status(200).json(featureFlag);
      } else {
        res.status(404).json({ status: 'failed', message: "Feature flag not found" });
      }
    } catch (error) {
      res.status(500).json({ status: 'failed', message: "Failed to retrieve feature flag" });
    }
  }

  private updateFeatureFlag = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {

      const featureFlag = await this.featureService.updateFeatureFlag(req.body);
      if (featureFlag) {
        res.status(200).json(featureFlag);
      } else {
        res.status(404).json({ status: 'failed', message: "Feature flag not found" });
      }
    } catch (error) {
      res.status(500).json({ status: 'failed', message: "Failed to update feature flag" });
    }
  }

  private deleteFeatureFlag = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const featureFlag = await this.featureService.deleteFeatureFlag(req.body.name);
      if (featureFlag) {
        res.status(200).json({ message: "Feature flag deleted successfully" });
      } else {
        res.status(404).json({ status: 'failed', message: "Feature flag not found" });
      }
    } catch (error) {
      res.status(500).json({ status: 'failed', message: "Failed to delete feature flag" });
    }
  }

  private listFeatureFlags = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const featureFlags = await this.featureService.listFeatureFlags();
      res.status(200).json({ status: 'success', message: 'success', payload: featureFlags });
    } catch (error) {
      res.status(500).json({ status: 'error', message: "Failed to retrieve feature flags" });
    }
  }
}

export default FeatureFlagsController