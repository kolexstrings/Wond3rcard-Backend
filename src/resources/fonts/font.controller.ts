import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GeneralController from "../../protocols/global.controller";
import { uploadFontMiddleware } from "../../middlewares/uploaders/uploadFont";
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
    /**
     * @openapi
     * /api/fonts/:
     *   get:
     *     tags: [fonts]
     *     summary: Retrieve all fonts
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       201:
     *         description: Fonts retrieved
     */
    this.router.get(`${this.path}/`, [authenticatedMiddleware], this.getFonts);

    /**
     * @openapi
     * /api/fonts/:
     *   post:
     *     tags: [fonts]
     *     summary: Upload a new font (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required: [fontFile]
     *             properties:
     *               fontFile:
     *                 type: string
     *                 format: binary
     *               style:
     *                 type: string
     *     responses:
     *       201:
     *         description: Font uploaded
     */
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

    /**
     * @openapi
     * /api/fonts/:
     *   put:
     *     tags: [fonts]
     *     summary: Update an existing font (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             $ref: '#/components/schemas/UpdateFont'
     *     responses:
     *       200:
     *         description: Font updated
     */
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

    /**
     * @openapi
     * /api/fonts/:
     *   delete:
     *     tags: [fonts]
     *     summary: Delete a font (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [id]
     *             properties:
     *               id:
     *                 type: string
     *     responses:
     *       200:
     *         description: Font deleted
     */
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
  ): Promise<void> => {
    try {
      const fonts = await this.fontsService.getAllFonts();
      res.status(201).json({
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
  ): Promise<void> => {
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
      res.status(201).json({
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
  ): Promise<void> => {
    try {
      const updates = { ...req.body };
      if (req.file) {
        updates.imageUrl = req.file.path;
      }

      const updatedSocialMedia = await this.fontsService.update(updates);
      res.status(200).json({
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
  ): Promise<void> => {
    try {
      const { id } = req.body;
      await this.fontsService.delete(id);
      res.status(200).json({ message: "Font deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}

export default FontsController;
