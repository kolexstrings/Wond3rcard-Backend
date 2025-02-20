import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import HttpException from "../exceptions/http.exception";
import Token from "../protocols/token.protocol";
import userModel from "../resources/user/user.model";
import { verifyToken } from "../utils/token";

async function profileMiddleware(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  const token = req.headers.authorization
  if (!token || !token.startsWith('Bearer')) {
    return next(new HttpException(401, "error", 'Unauthorized'))
  }
  const accessToken = token.split(' ')[1].trim()

  try {
    const payload: Token | jwt.JsonWebTokenError = await verifyToken(accessToken)
    if (payload instanceof jwt.JsonWebTokenError) {
      return next(new HttpException(401, "error", 'Unauthorized'))
    }

    const uid = payload.id

    const user = await userModel.findById(uid).select('-password').exec()
    if (!user) {
      return next(new HttpException(401, "error", 'Unauthorized'))
    }

    next();

  } catch (error: any) {
    return next(new HttpException(401, "error", `Unauthorized`))
  }

}

export default profileMiddleware

