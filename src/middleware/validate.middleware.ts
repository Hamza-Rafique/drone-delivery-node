import { Request, Response, NextFunction } from 'express';

export const validate =
  (fields: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    for (const field of fields) {
      if (!req.body[field]) {
        return res.status(400).json({
          message: `Missing required field: ${field}`
        });
      }
    }
    next();
  };
