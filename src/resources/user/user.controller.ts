import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import GeneralController from "../../protocols/global.controller";
import UserService from "./user.service";

class UserController implements GeneralController {
  public path = "/users";
  public router = Router();
  private userService = new UserService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    /**
     * @openapi
     * /api/users/user-profile:
     *   get:
     *     tags: [users]
     *     summary: Get the authenticated user's profile
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Profile retrieved
     */
    this.router.get(
      `${this.path}/user-profile`,
      authenticatedMiddleware,
      this.getProfile
    );
  }

  private getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        return next(new HttpException(401, "error", "No signed-in user"));
      }

      const profile = await this.userService.getProfile(req.user.id);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: {
          user: req.user,
          profile,
        },
      });

      return; // Explicitly return void
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
