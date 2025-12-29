import { NextFunction, Request, Response, Router } from "express";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GeneralController from "../../protocols/global.controller";
import { uploadSocialMediaMiddleware } from "../../middlewares/uploaders/uploadSocialMedia";
import { UserRole } from "../user/user.protocol";
import SocialMediaService from "./social-media.service";
import validate from "./social-media.validations";

class SocialMediaController implements GeneralController {
  public path = "/social-medias";
  public router = Router();
  private socialMediaService = new SocialMediaService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    /**
     * @openapi
     * /api/social-medias/:
     *   get:
     *     tags: [social-medias]
     *     summary: Get all social media links
     *     responses:
     *       200:
     *         description: Social media links retrieved
     */
    this.router.get(`${this.path}/`, this.getAllSocialMedias);

    /**
     * @openapi
     * /api/social-medias/:
     *   post:
     *     tags: [social-medias]
     *     summary: Create a new social media entry (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required: [name, mediaType]
     *             properties:
     *               name:
     *                 type: string
     *               mediaType:
     *                 type: string
     *               image:
     *                 type: string
     *                 format: binary
     *     responses:
     *       201:
     *         description: Social media created
     */
    this.router.post(
      `${this.path}/`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        uploadSocialMediaMiddleware,
        validationMiddleware(validate.createSocialMediaValidator),
      ],
      this.createSocialMedia
    );

    /**
     * @openapi
     * /api/social-medias/{id}:
     *   put:
     *     tags: [social-medias]
     *     summary: Update a social media entry (Admin only)
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
     *         multipart/form-data:
     *           schema:
     *             $ref: '#/components/schemas/UpdateSocialMedia'
     *     responses:
     *       200:
     *         description: Social media updated
     */
    this.router.put(
      `${this.path}/:id`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        uploadSocialMediaMiddleware,
      ],
      this.updateSocialMedia
    );

    /**
     * @openapi
     * /api/social-medias/{id}:
     *   delete:
     *     tags: [social-medias]
     *     summary: Delete a social media entry (Admin only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Social media deleted
     */
    this.router.delete(
      `${this.path}/:id`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.deleteSocialMedia
    );
  }

  private getAllSocialMedias = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const links = await this.socialMediaService.getAll();
      res.status(200).json({ message: "Social Media links", payload: links });
    } catch (error) {
      next(error);
    }
  };

  private createSocialMedia = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, mediaType } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "Image upload failed" });
      }

      const socialMedial = await this.socialMediaService.checkAndUpdateOrCreate(
        name,
        file.path,
        mediaType
      );

      res.status(201).json({
        message: "social media created successfully",
        payload: { socialMedial },
      });
    } catch (error) {
      next(error);
    }
  };

  private updateSocialMedia = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      if (req.file) {
        updates.imageUrl = req.file.path;
      }

      const updatedSocialMedia = await this.socialMediaService.update(
        id,
        updates
      );
      res.status(200).json({
        message: "Social media updated successfully",
        payload: updatedSocialMedia,
      });
    } catch (error) {
      next(error);
    }
  };

  private deleteSocialMedia = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.socialMediaService.delete(id);
      res.status(200).json({ message: "Social media deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
export default SocialMediaController;
