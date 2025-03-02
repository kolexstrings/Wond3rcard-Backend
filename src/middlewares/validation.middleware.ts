import { NextFunction, Request, RequestHandler, Response } from "express";
import Joi from "joi";

function validationMiddleware(schema: Joi.Schema): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };

    try {
      const mergedData = req.file
        ? { ...req.body, imageUrl: req.file.path }
        : req.body;

      const value = await schema.validateAsync(mergedData, validationOptions);
      req.body = value;
      next();
    } catch (e: any) {
      const errors: string[] = [];
      e.details.forEach((error: Joi.ValidationErrorItem) => {
        errors.push(error.message);
      });

      res.status(400).send({
        message: "Validation Failed",
        status: "error",
        payload: errors,
      });
    }
  };
}

export default validationMiddleware;
