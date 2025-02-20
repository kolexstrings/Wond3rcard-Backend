import { NextFunction, Request, Response } from 'express';
import HttpException from '../exceptions/http.exception';

async function setup2FAMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {

  try {
    await res.status(200).json({ message: "hello" })
    next()
  } catch (error) {
    throw new HttpException(500, "error", "Error setting up 2FA")
  }
}

export default setup2FAMiddleware