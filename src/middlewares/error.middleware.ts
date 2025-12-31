import { NextFunction, Request, Response } from "express";
import HttpException from "../exceptions/http.exception";

function errorMiddleware(
  error: HttpException | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("ERROR", error);

  const statusCode = error instanceof HttpException ? error.statusCode : 500;
  const status = error instanceof HttpException ? error.status : "error";
  const message =
    error instanceof HttpException ? error.message : "Internal Server Error";

  if (res.headersSent) {
    return next(error);
  }

  res.status(statusCode).json({ status, message });
}

export default errorMiddleware;
