import { Request, Response, NextFunction, Router } from "express";
import HttpException from "../../../exceptions/http.exception";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import GeneralController from "../../../protocols/global.controller";
import PhysicalCardOrderService from "./order.service";
import ManualOrderService from "./manual/manual.service";
import validationMiddleware from "../../../middlewares/validation.middleware";
import verifyOrgRolesMiddleware from "../../../middlewares/orgnizationRoles.middleware";
import { UserRole } from "../../user/user.protocol";
import validate from "./order.validation";

class PhysicalCardOrderController implements GeneralController {
  public path = "/card-orders";
  public router = Router();
  private physicalCardOrderService = new PhysicalCardOrderService();
  private manualCardOrderService = new ManualOrderService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.post(
      `${this.path}/create`,
      [
        authenticatedMiddleware,
        validationMiddleware(validate.validateCreateOrder),
      ],
      this.createOrder
    );

    this.router.post(
      `${this.path}/create-manual`,
      [
        authenticatedMiddleware,
        verifyOrgRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validate.validateCreateManualOrder),
      ],

      this.createManualOrder
    );

    this.router.get(
      `${this.path}/`,
      [authenticatedMiddleware],
      this.getAllOrders
    );

    this.router.get(
      `${this.path}/order/:orderId`,
      authenticatedMiddleware,
      this.getOrderById
    );

    this.router.get(
      `${this.path}/user/:userId/orders`,
      authenticatedMiddleware,
      this.getUserOrders
    );
  }

  private createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        userId,
        physicalCardId,
        cardTemplateId,
        quantity,
        region,
        address,
      } = req.body;

      // Validate required fields
      if (
        !userId ||
        !physicalCardId ||
        !cardTemplateId ||
        !quantity ||
        !region ||
        !address
      ) {
        res.status(400).json({
          statusCode: 400,
          status: "error",
          message: "Missing required fields",
        });
      }

      // Create order
      const order = await this.physicalCardOrderService.createOrder(
        userId,
        physicalCardId,
        cardTemplateId,
        quantity,
        region,
        address
      );

      res.status(201).json({
        statusCode: 201,
        status: "success",
        payload: order,
      });
    } catch (error) {
      next(error);
    }
  };

  private createManualOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        userId,
        physicalCardId,
        cardTemplateId,
        quantity,
        region,
        address,
      } = req.body;

      // Validate required fields
      if (
        !userId ||
        !physicalCardId ||
        !cardTemplateId ||
        !quantity ||
        !region ||
        !address
      ) {
        throw new HttpException(400, "error", "Missing required fields");
      }

      // Call the service method for manual order creation
      const { order, transaction } =
        await this.manualCardOrderService.createManualOrder(
          userId,
          physicalCardId,
          cardTemplateId,
          quantity,
          region,
          address
        );

      res.status(201).json({
        statusCode: 201,
        status: "success",
        payload: { order, transaction },
      });
    } catch (error) {
      next(error);
    }
  };

  private getAllOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const orders = await this.physicalCardOrderService.getAllOrders();
      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: orders,
      });
    } catch (error) {
      next(error);
    }
  };

  private getOrderById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return next(new HttpException(400, "error", "Order ID is required"));
      }

      const order = await this.physicalCardOrderService.getOrderById(orderId);

      if (!order) {
        return next(new HttpException(404, "error", "Order not found"));
      }

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: order,
      });
    } catch (error) {
      next(error);
    }
  };

  private getUserOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return next(new HttpException(400, "error", "User ID is required"));
      }

      const userOrders = await this.physicalCardOrderService.getUserOrders(
        userId
      );

      if (!userOrders) {
        return next(
          new HttpException(404, "error", "No orders found for this user")
        );
      }

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: userOrders,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default PhysicalCardOrderController;
