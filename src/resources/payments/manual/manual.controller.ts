import { Request, Response, NextFunction, Router } from "express";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import validationMiddleware from "../../../middlewares/validation.middleware";
import verifyRolesMiddleware from "../../../middlewares/roles.middleware";
import { validateManualPayment } from "./manual.validations";
import { UserRole } from "../../user/user.protocol";
import ManualPaymentService from "./manual.service";

class ManualPaymentController {
  public path = "/manual-payment";
  public router = Router();
  private manualPaymentService = new ManualPaymentService();
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/initialize-payment`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateManualPayment),
        verifyRolesMiddleware([UserRole.Admin]),
      ],
      this.createManualPayment
    );
  }

  private createManualPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await this.manualPaymentService.createManualPayment(
        req.body
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default ManualPaymentController;
