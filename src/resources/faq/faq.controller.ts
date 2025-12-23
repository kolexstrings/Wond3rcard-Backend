import { NextFunction, Request, Response, Router } from "express";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GeneralController from "../../protocols/global.controller";
import { UserRole } from "../user/user.protocol";
import FAQService from "./faq.service";
import validate from "./faq.validation";

class FAQController implements GeneralController {
  public path = "/faq";
  public router = Router();
  private service = new FAQService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    /**
     * @openapi
     * /api/faq/:
     *   get:
     *     tags: [faq]
     *     summary: Retrieve all FAQs, optionally filtered by category
     *     parameters:
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: FAQs retrieved
     */
    this.router.get(`${this.path}/`, this.getAllFAQs);

    /**
     * @openapi
     * /api/faq/:
     *   post:
     *     tags: [faq]
     *     summary: Create a new FAQ (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateFAQ'
     *     responses:
     *       201:
     *         description: FAQ created
     */
    this.router.post(
      `${this.path}/`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validate.faqValidationSchema),
      ],
      this.createFAQ
    );

    /**
     * @openapi
     * /api/faq/{id}:
     *   put:
     *     tags: [faq]
     *     summary: Update an existing FAQ (Admin only)
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
     *             $ref: '#/components/schemas/UpdateFAQ'
     *     responses:
     *       200:
     *         description: FAQ updated
     */
    this.router.put(
      `${this.path}/:id`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.updateFAQ
    );

    /**
     * @openapi
     * /api/faq/{id}:
     *   delete:
     *     tags: [faq]
     *     summary: Delete an FAQ (Admin only)
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
     *         description: FAQ deleted
     */
    this.router.delete(
      `${this.path}/:id`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.deleteFAQ
    );
  }

  private getAllFAQs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { category } = req.query;
      const faqs = await this.service.getAllFAQs(category as string);
      res
        .status(200)
        .json({ message: "FAQs retrieved successfully", payload: faqs });
    } catch (error) {
      next(error);
    }
  };

  private createFAQ = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = req.body;
      const newFAQ = await this.service.createFAQ(data);
      res
        .status(201)
        .json({ message: "FAQ created successfully", payload: newFAQ });
    } catch (error) {
      next(error);
    }
  };

  private updateFAQ = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updatedFAQ = await this.service.updateFAQ(id, data);
      if (!updatedFAQ) {
        res.status(404).json({ message: "FAQ not found" });
      }
      res
        .status(200)
        .json({ message: "FAQ updated successfully", payload: updatedFAQ });
    } catch (error) {
      next(error);
    }
  };

  private deleteFAQ = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const deletedFAQ = await this.service.deleteFAQ(id);
      if (!deletedFAQ) {
        res.status(404).json({ message: "FAQ not found" });
      }
      res
        .status(200)
        .json({ message: "FAQ deleted successfully", payload: deletedFAQ });
    } catch (error) {
      next(error);
    }
  };
}

export default FAQController;
