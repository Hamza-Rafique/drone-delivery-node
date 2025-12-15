import { Router } from "express";
import { param, body } from "express-validator";
import { authenticateToken } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { adminController } from "../controllers/admin.controller";

const router = Router();

// Apply auth + role middleware to all admin routes
router.use(authenticateToken, requireRole(["ADMIN"]));

/**
 * Orders
 */
router.get("/orders", adminController.getAllOrders);

router.put(
  "/orders/:id",
  [
    param("id").isMongoId(),
    body("origin.lat").optional().isFloat({ min: -90, max: 90 }),
    body("origin.lng").optional().isFloat({ min: -180, max: 180 }),
    body("destination.lat").optional().isFloat({ min: -90, max: 90 }),
    body("destination.lng").optional().isFloat({ min: -180, max: 180 }),
  ],
  validateRequest,
  adminController.updateOrder
);

/**
 * Drones
 */
router.get("/drones", adminController.getDrones);

router.put(
  "/drones/:id/status",
  [
    param("id").isMongoId(),
    body("status").isIn(["IDLE", "BUSY", "BROKEN"]),
  ],
  validateRequest,
  adminController.updateDroneStatus
);

export default router;
