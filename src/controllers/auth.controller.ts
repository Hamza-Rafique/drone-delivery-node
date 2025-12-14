import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { LoginRequest, UserRole } from "../types";

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { name, role }: LoginRequest = req.body;

      if (!name || !role) {
        res.status(400).json({ error: "Name and role are required" });
        return;
      }

      if (!["admin", "enduser", "drone"].includes(role)) {
        res
          .status(400)
          .json({ error: "Invalid role. Must be admin, enduser, or drone" });
        return;
      }

      const { token, user } = await authService.login(name, role as UserRole);

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async verify(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      res.status(200).json({
        success: true,
        user: req.user,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
