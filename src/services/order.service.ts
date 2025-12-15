import Drone from "../models/Drone";
import { Order } from "../models/Order";

import { Types } from "mongoose";

export class OrderService {
  // Reserve order for drone
  static async reserveOrder(droneId: Types.ObjectId) {
    const drone = await Drone.findById(droneId);
    if (!drone || drone.status !== "IDLE") throw new Error("Drone not available");

    const order = await Order.findOne({ status: "SUBMITTED", assignedDrone: null });
    if (!order) throw new Error("No order available to reserve");

    order.status = "RESERVED";
    order.assignedDrone = drone._id;

    drone.status = "BUSY";
    drone.currentOrder = order._id;

    await Promise.all([order.save(), drone.save()]);

    return order;
  }

  // Mark order as delivered or failed
  static async completeOrder(orderId: string, droneId: string, status: "DELIVERED" | "FAILED") {
    const order = await Order.findById(orderId);
    if (!order || !order.assignedDrone?.equals(droneId)) throw new Error("Invalid order");

    order.status = status;
    order.assignedDrone = null;
    await order.save();

    const drone = await Drone.findById(droneId);
    if (drone) {
      drone.status = "IDLE";
      drone.currentOrder = null;
      await drone.save();
    }

    return order;
  }
}
