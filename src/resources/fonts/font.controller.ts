import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GeneralController from "../../protocols/global.controller";
import { uploadFontMiddleware } from "../../services/multers.config";
import { UserRole } from "../user/user.protocol";
import FontsService from "./fonts.service";
import validator from "./fonts.validation";

class FontsController implements GeneralController {
  public path = "/fonts";
  public router = Router();
  private fontsService = new FontsService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.get(`${this.path}/`, [authenticatedMiddleware], this.getFonts);

    this.router.post(
      `${this.path}/`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        uploadFontMiddleware,
      ],
      validationMiddleware(validator.upload),
      this.uploadFont
    );

    this.router.put(
      `${this.path}/`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        uploadFontMiddleware,
        validationMiddleware(validator.update),
      ],

      this.updateFont
    );

    this.router.delete(
      `${this.path}/`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validator.deleteFont),
      ],
      this.deleteFont
    );
  }

  private getFonts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const fonts = await this.fontsService.getAllFonts();
      return res.status(201).json({
        status: "success",
        message: "Fonts retrieved successfully",
        payload: { fonts },
      });
    } catch (error) {
      next(
        new HttpException(500, "failed", `Failed to retrieve fonts:${error}`)
      );
    }
  };

  private uploadFont = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      if (!req.file) {
        throw new HttpException(400, "failed", "Font file missing");
      }
      const file = req.file;
      const { style } = req.body;
      const { originalname, path } = file;
      const result = await this.fontsService.checkAndUpdateOrUpload(
        originalname,
        style,
        path
      );
      return res.status(201).json({
        status: "success",
        message: "File uploaded successfully",
        payload: { result },
      });
    } catch (error) {
      next(new HttpException(500, "failed", `Failed to upload font:${error}`));
    }
  };

  private updateFont = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const updates = { ...req.body };
      if (req.file) {
        updates.imageUrl = req.file.path;
      }

      const updatedSocialMedia = await this.fontsService.update(updates);
      return res.status(200).json({
        message: "Font updated successfully",
        payload: updatedSocialMedia,
      });
    } catch (error) {
      next(error);
    }
  };

  private deleteFont = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { id } = req.body;
      await this.fontsService.delete(id);
      return res.status(200).json({ message: "Font deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}

export default FontsController;
