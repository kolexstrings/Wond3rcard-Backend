import { NextFunction, Request, Response } from "express";
import HttpException from "../exceptions/http.exception";
import cardModel from "../resources/card/card.model";
import { UserRole } from "../resources/user/user.protocol";

export const canCreateCardMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return next(new HttpException(401, 'failed', 'Unauthorized'));
    }

    if (user.userRole === UserRole.normal) {
      const userCards = await cardModel.find({ createdBy: user.id });

      if (userCards.length >= 1) {
        throw new HttpException(403, 'failed', 'Normal users can create only one card');
      }
    }

    next();
  } catch (error) {
    console.error('Error in canCreateCardMiddleware:', error);
    next(error);
  }
};