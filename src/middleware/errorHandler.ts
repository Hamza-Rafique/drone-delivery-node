import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else {
    console.error(err); // log server errors
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
