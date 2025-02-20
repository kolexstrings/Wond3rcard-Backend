import { NextFunction, Request, Response } from "express";
import HttpException from "../exceptions/http.exception";

function errorMiddleware(error: HttpException, req: Request, res: Response, next: NextFunction,): void {
  console.log(`ERROR ${error}`)

  const status = error.status || "error"
  const statusCode = error.statusCode || 500
  const message = error.message || "Something went wrong"

  if (error instanceof HttpException) {
    res.status(statusCode).json({ status, message });
  }

  res.status(500).json({ status, message: 'Internal Server Error' });

}

export default errorMiddleware