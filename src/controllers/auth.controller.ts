import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export const authController = {
  async login(req: Request, res: Response) {
    const { name, role } = req.body;

    const result = await authService.login(name, role);

    res.json(result);
  },
};
