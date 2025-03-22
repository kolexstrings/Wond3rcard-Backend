import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import GeneralController from "../../protocols/global.controller";
import ConnectionService from "./connections.service";

class ConnectionController implements GeneralController {
  public path = "/connections";
  public router = Router();
  private connectionService = new ConnectionService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.post(
      `${this.path}/add`,
      authenticatedMiddleware,
      this.addConnection
    );
    this.router.post(
      `${this.path}/remove`,
      authenticatedMiddleware,
      this.removeConnection
    );
    this.router.get(
      `${this.path}/list`,
      authenticatedMiddleware,
      this.getUserConnections
    );
  }

  private addConnection = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user.id; // Get authenticated user's ID
      const { connectionId } = req.body;

      if (!connectionId) {
        return next(
          new HttpException(400, "error", "Connection ID is required")
        );
      }

      const updatedUser = await this.connectionService.addConnection({
        userId,
        connectionId,
      });

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: updatedUser.connections, // Return updated connections list
      });
    } catch (error) {
      next(error);
    }
  };

  private removeConnection = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user.id;
      const { connectionId } = req.body;

      if (!connectionId) {
        return next(
          new HttpException(400, "error", "Connection ID is required")
        );
      }

      const updatedUser = await this.connectionService.removeConnection({
        userId,
        connectionId,
      });

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: updatedUser.connections, // Return updated connections list
      });
    } catch (error) {
      next(error);
    }
  };

  private getUserConnections = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user.id;

      const connections = await this.connectionService.getUserConnections(
        userId
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: connections,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ConnectionController;
