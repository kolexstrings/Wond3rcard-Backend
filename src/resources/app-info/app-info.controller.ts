import { NextFunction, Request, Response, Router } from "express";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GeneralController from "../../protocols/global.controller";
import { UserRole } from "../user/user.protocol";
import AppInfoService from "./app-info.service";
import validate from "./app-info.validation";

class AppInfoController implements GeneralController {
  public path = "/app-info";
  public router = Router();
  private service = new AppInfoService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @openapi
     * /api/app-info:
     *   get:
     *     tags: [app-info]
     *     summary: Get app information
     *     responses:
     *       200:
     *         description: App info retrieved
     */
    this.router.get(`${this.path}`, this.getAppInfo);

    /**
     * @openapi
     * /api/app-info:
     *   post:
     *     tags: [app-info]
     *     summary: Create or update app info (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AppInfo'
     *     responses:
     *       200:
     *         description: App info updated
     */
    this.router.post(
      `${this.path}`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validate.appInfoValidationSchema),
      ],
      this.createOrUpdateAppInfo
    );

    /**
     * @openapi
     * /api/app-info/{id}:
     *   put:
     *     tags: [app-info]
     *     summary: Update app info by ID (Admin only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AppInfo'
     *     responses:
     *       200:
     *         description: App info updated
     */
    this.router.put(
      `${this.path}/:id`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validate.appInfoValidationSchema),
      ],
      this.updateAppInfo
    );

    /**
     * @openapi
     * /api/app-info/{id}:
     *   delete:
     *     tags: [app-info]
     *     summary: Delete app info (Admin only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: App info deleted
     */
    this.router.delete(
      `${this.path}/:id`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.deleteAppInfo
    );
  }

  private getAppInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const appInfo = await this.service.getAppInfo();
      res.status(200).json({ message: "App Info", payload: appInfo });
    } catch (error) {
      next(error);
    }
  };

  private createOrUpdateAppInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = req.body;
      const updatedAppInfo = await this.service.upsertAppInfo(data);
      res.status(200).json({
        message: "App Info updated successfully",
        payload: updatedAppInfo,
      });
    } catch (error) {
      next(error);
    }
  };

  private updateAppInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updatedAppInfo = await this.service.upsertAppInfo({
        ...data,
        _id: id,
      });
      res.status(200).json({
        message: "App Info updated successfully",
        payload: updatedAppInfo,
      });
    } catch (error) {
      next(error);
    }
  };

  private deleteAppInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteAppInfo();
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export default AppInfoController;
