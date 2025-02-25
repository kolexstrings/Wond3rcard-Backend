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
    this.router.get(`${this.path}`, this.getAppInfo);

    this.router.post(
      `${this.path}`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validate.appInfoValidationSchema),
      ],
      this.createOrUpdateAppInfo
    );

    this.router.put(
      `${this.path}/:id`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validate.appInfoValidationSchema),
      ],
      this.updateAppInfo
    );

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
  ): Promise<Response | void> => {
    try {
      const appInfo = await this.service.getAppInfo();
      return res.status(200).json({ message: "App Info", payload: appInfo });
    } catch (error) {
      next(error);
    }
  };

  private createOrUpdateAppInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const data = req.body;
      const updatedAppInfo = await this.service.upsertAppInfo(data);
      return res.status(200).json({
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
  ): Promise<Response | void> => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updatedAppInfo = await this.service.upsertAppInfo({
        ...data,
        _id: id,
      });
      return res.status(200).json({
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
  ): Promise<Response | void> => {
    try {
      const { id } = req.params;
      await this.service.deleteAppInfo();
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export default AppInfoController;
