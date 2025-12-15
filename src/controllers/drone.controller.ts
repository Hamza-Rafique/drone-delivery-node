import { Request, Response } from "express";
import { Order } from "../models/Order";
import { Drone } from "../models/Drone";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export const droneController = {
  async reserveJob(req: Request, res: Response) {
    const droneId = req.user!.id;

    const drone = await Drone.findById(droneId);
    if (!drone || drone.status !== "IDLE") {
      return res.status(400).json({
        message: "Drone is not available to reserve a job.",
      });
    }

    const order = await Order.findOne({
      status: "SUBMITTED",
      assignedDrone: null,
    });

    if (!order) {
      return res.status(404).json({
        message: "No available orders to reserve.",
      });
    }

    order.status = "RESERVED";
    order.assignedDrone = drone._id;

    drone.status = "BUSY";
    drone.currentOrder = order._id;

    await Promise.all([order.save(), drone.save()]);

    return res.status(200).json({
      message: "Order reserved successfully.",
      data: order,
    });
  },

  
  async pickupOrder(req: Request, res: Response) {
    const droneId = req.user!.id;
    const { orderId } = req.params;
    const { lat, lng } = req.body;

    const order = await Order.findById(orderId);
    if (!order || !order.assignedDrone) {
      return res.status(404).json({
        message: "Order not found or not assigned.",
      });
    }

    if (!order.assignedDrone.equals(droneId)) {
      return res.status(403).json({
        message: "This order is not assigned to this drone.",
      });
    }

    order.status = "PICKED";
    order.currentLocation = { lat, lng };

    await order.save();

    return res.status(200).json({
      message: "Order picked up successfully.",
      data: order,
    });
  },

  /**
   * Deliver or fail an order
   */
  async deliverOrder(req: Request, res: Response) {
    const droneId = req.user!.id;
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order || !order.assignedDrone) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (!order.assignedDrone.equals(droneId)) {
      return res.status(403).json({
        message: "This order is not assigned to this drone.",
      });
    }

    order.status = status === "DELIVERED" ? "DELIVERED" : "FAILED";
    order.notes = notes || null;

    const drone = await Drone.findById(droneId);
    if (drone) {
      drone.status = "IDLE";
      drone.currentOrder = null;
      await drone.save();
    }

    order.assignedDrone = null;
    await order.save();

    return res.status(200).json({
      message:
        status === "DELIVERED"
          ? "Order delivered successfully."
          : "Order marked as failed.",
      data: order,
    });
  },

 
  async reportBroken(req: Request, res: Response) {
    const droneId = req.user!.id;
    const { lat, lng, reason } = req.body;

    const drone = await Drone.findById(droneId);
    if (!drone) {
      return res.status(404).json({
        message: "Drone not found.",
      });
    }

    // Release order if exists
    if (drone.currentOrder) {
      await Order.findByIdAndUpdate(drone.currentOrder, {
        status: "SUBMITTED",
        assignedDrone: null,
        notes: "Released due to drone failure.",
      });
    }

    drone.status = "BROKEN";
    drone.currentOrder = null;
    drone.location = { lat, lng };
    drone.lastError = reason || "Reported broken";

    await drone.save();

    return res.status(200).json({
      message:
        "Drone marked as broken. Any assigned order has been released for reassignment.",
    });
  },

 
  async updateHeartbeat(req: Request, res: Response) {
    const droneId = req.user!.id;
    const { lat, lng, batteryLevel } = req.body;

    const drone = await Drone.findById(droneId);
    if (!drone) {
      return res.status(404).json({
        message: "Drone not found.",
      });
    }

    drone.location = { lat, lng };
    drone.batteryLevel = batteryLevel;
    drone.lastSeenAt = new Date();

    await drone.save();

    return res.status(200).json({
      message: "Drone heartbeat updated successfully.",
    });
  },

  /**
   * Get currently assigned order
   */
  async getCurrentOrder(req: Request, res: Response) {
    const droneId = req.user!.id;

    const drone = await Drone.findById(droneId).populate("currentOrder");
    if (!drone || !drone.currentOrder) {
      return res.status(404).json({
        message: "No order currently assigned to this drone.",
      });
    }

    return res.status(200).json({
      message: "Current assigned order retrieved successfully.",
      data: drone.currentOrder,
    });
  },
};
