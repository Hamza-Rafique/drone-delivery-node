import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';


export const authorize =
  (roles: Array<'admin' | 'enduser' | 'drone'>) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.type)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
