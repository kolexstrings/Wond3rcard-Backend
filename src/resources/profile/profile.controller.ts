import { NextFunction, Request, Response, Router } from "express";
import Joi from "joi";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import ProfileService from "./profile.service";
import validator from "./profile.validation";
import { Types } from "mongoose";
import HttpException from "../../exceptions/http.exception";

class ProfileController {
  public path = "/profile";
  public router = Router();
  private profileService = new ProfileService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      `${this.path}/:id/contacts`,
      [authenticatedMiddleware],
      this.getContacts
    );

    this.router.post(
      `${this.path}/:id/contacts`,
      [authenticatedMiddleware, validationMiddleware(validator.addContact)],
      this.addContact
    );

    this.router.post(
      `${this.path}/connect`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.connectValidator),
      ],
      this.connect
    );

    this.router.get(
      `${this.path}/connections`,
      authenticatedMiddleware,
      this.getConnections
    );

    this.router.get(
      `${this.path}/suggestions`,
      authenticatedMiddleware,
      this.suggestConnections
    );

    this.router.patch(
      `${this.path}/remove-contact`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.connectValidator),
      ],
      this.removeContact
    );

    this.router.patch(
      `${this.path}/remove-connection`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.connectValidator),
      ],
      this.removeConnection
    );
  }

  private getContacts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const contacts = await this.profileService.getContacts(req.params.id);
      res
        .status(200)
        .json({ message: "Contacts retrieved", payload: contacts });
    } catch (error) {
      next(error);
    }
  };

  private addContact = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { error } = validator.idValidator.validate(req.params.id);
      if (error) {
        const errors: string[] = [];
        error.details.forEach((error: Joi.ValidationErrorItem) => {
          errors.push(error.message);
        });
        res.status(400).send({
          message: "Invalid ID format",
          status: "error",
          errors: errors,
        });
      }
      const uid = req.params.id;
      const { contactEmail } = req.body;

      const user = await this.profileService.addContact(uid, contactEmail);
      res.status(200).json({ message: "Contact added", data: user });
    } catch (error) {
      next(error);
    }
  };

  private connect = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const uid = req.user.id;
      const { userId } = req.body;
      const user = await this.profileService.connect(uid, userId);
      res.status(200).json({ message: "Connection added", payload: user });
    } catch (error) {
      next(error);
    }
  };

  private getConnections = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const uid = req.user.id;
      const connections = await this.profileService.getConnections(uid);
      res
        .status(200)
        .json({ message: "Connections retrieved", payload: connections });
    } catch (error) {
      next(error);
    }
  };

  private suggestConnections = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const uid = req.user.id;

      const suggestions = await this.profileService.suggestConnections(uid);
      res
        .status(200)
        .json({ message: "Connection suggestions", payload: suggestions });
    } catch (error) {
      next(error);
    }
  };

  private removeContact = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const uid = req.user.id;
      const { userId } = req.body;

      if (!Types.ObjectId.isValid(uid) || !Types.ObjectId.isValid(userId)) {
        throw new HttpException(
          400,
          "Invalid ID",
          "Invalid userId or contactId format"
        );
      }

      const user = await this.profileService.removeContact(uid, userId);
      res.status(200).json({ message: "Contact removed", data: user });
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
      const uid = req.user.id;
      const { userId } = req.body;

      const user = await this.profileService.removeConnection(uid, userId);
      res.status(200).json({ message: "Contact added", data: user });
    } catch (error) {
      next(error);
    }
  };
}

export default ProfileController;
