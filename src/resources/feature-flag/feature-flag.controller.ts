import { NextFunction, Request, Response, Router } from "express";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GlobalController from "../../protocols/global.controller";
import validate from "../../resources/feature-flag/feature-flags.validation";
import FeatureFlagService from "./feature-flag.service";
import { UserRole } from "../user/user.protocol";
import { UserTiers } from "../user/user.protocol";

class FeatureFlagsController implements GlobalController {
  public path = "/feature-flags";
  public router = Router();

  private featureService: FeatureFlagService = new FeatureFlagService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /api/feature-flags:
     *   get:
     *     tags: [feature-flags]
     *     summary: List all feature flags
     *     responses:
     *       200:
     *         description: Feature flags retrieved
     */
    this.router.get(`${this.path}`, this.listFeatureFlags);

    /**
     * @openapi
     * /api/feature-flags/create-feature:
     *   post:
     *     tags: [feature-flags]
     *     summary: Create a new feature flag (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name: { type: "string" }
     *               description: { type: "string" }
     *               enabled: { type: "boolean" }
     *     responses:
     *       201:
     *         description: Feature flag created
     */
    this.router.post(
      `${this.path}/create-feature`,
      [
        validationMiddleware(validate.validateCreateFeature),
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
      ],
      this.createFeatureFlag
    );

    /**
     * @openapi
     * /api/feature-flags/get-feature:
     *   post:
     *     tags: [feature-flags]
     *     summary: Retrieve a feature flag by name
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [featureName]
     *             properties:
     *               featureName:
     *                 type: string
     *     responses:
     *       200:
     *         description: Feature flag retrieved
     */
    this.router.post(
      `${this.path}/get-feature`,
      [validationMiddleware(validate.validateGetFeatureFlag)],
      this.getFeatureFlag
    );

    /**
     * @openapi
     * /api/feature-flags/update-feature:
     *   post:
     *     tags: [feature-flags]
     *     summary: Update an existing feature flag (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name, description, enabled]
     *             properties:
     *               name: { type: "string" }
     *               description: { type: "string" }
     *               enabled: { type: "boolean" }
     *     responses:
     *       200:
     *         description: Feature flag updated
     */
    this.router.post(
      `${this.path}/update-feature`,
      [
        validationMiddleware(validate.validateUpdateFeature),
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
      ],
      this.updateFeatureFlag
    );

    /**
     * @openapi
     * /api/feature-flags/delete-feature:
     *   post:
     *     tags: [feature-flags]
     *     summary: Delete a feature flag (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name:
     *                 type: string
     *     responses:
     *       200:
     *         description: Feature flag deleted
     */
    this.router.post(
      `${this.path}/delete-feature`,
      [
        validationMiddleware(validate.validateDeleteFeatureFlag),
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
      ],
      this.deleteFeatureFlag
    );

    /**
     * @openapi
     * /api/feature-flags/by-tier/{tier}:
     *   get:
     *     tags: [feature-flags]
     *     summary: Get feature flags for a specific user tier
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: tier
     *         required: true
     *         schema:
     *           type: string
     *           enum: [basic, premium, business]
     *     responses:
     *       200:
     *         description: Feature flags for tier retrieved
     */
    this.router.get(
      `${this.path}/by-tier/:tier`,
      authenticatedMiddleware,
      this.getFeatureFlagByTier
    );
  }

  private createFeatureFlag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const featureFlag = await this.featureService.createFeatureFlag(req.body);
      res.status(201).json(featureFlag);
    } catch (error) {
      res
        .status(500)
        .json({ status: "failed", message: "Failed to create feature flag" });
    }
  };

  private getFeatureFlag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { featureName } = req.body;
      const featureFlag = await this.featureService.getFeatureFlag(featureName);
      if (featureFlag) {
        res.status(200).json(featureFlag);
      } else {
        res
          .status(404)
          .json({ status: "failed", message: "Feature flag not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ status: "failed", message: "Failed to retrieve feature flag" });
    }
  };

  private updateFeatureFlag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const featureFlag = await this.featureService.updateFeatureFlag(req.body);
      if (featureFlag) {
        res.status(200).json(featureFlag);
      } else {
        res
          .status(404)
          .json({ status: "failed", message: "Feature flag not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ status: "failed", message: "Failed to update feature flag" });
    }
  };

  private deleteFeatureFlag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const featureFlag = await this.featureService.deleteFeatureFlag(
        req.body.name
      );
      if (featureFlag) {
        res.status(200).json({ message: "Feature flag deleted successfully" });
      } else {
        res
          .status(404)
          .json({ status: "failed", message: "Feature flag not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ status: "failed", message: "Failed to delete feature flag" });
    }
  };

  private listFeatureFlags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const featureFlags = await this.featureService.listFeatureFlags();
      res
        .status(200)
        .json({ status: "success", message: "success", payload: featureFlags });
    } catch (error) {
      res
        .status(500)
        .json({ status: "error", message: "Failed to retrieve feature flags" });
    }
  };

  private getFeatureFlagByTier = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const tier = req.params.tier.toLowerCase() as UserTiers;

      if (!Object.values(UserTiers).includes(tier)) {
        res.status(400).json({
          status: "error",
          message: "Invalid user tier",
        });
        return;
      }

      const featureFlags = await this.featureService.getFeatureFlagsByTier(
        tier
      );
      res.status(200).json({ status: "success", featureFlags });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve feature flags for the given tier",
      });
    }
  };
}

export default FeatureFlagsController;
