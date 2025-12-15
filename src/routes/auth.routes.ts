import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
const authController = new AuthController();

router.post("/login", authController.login.bind(authController));

router.get("/verify", authenticate, authController.verify.bind(authController));

export default router;
