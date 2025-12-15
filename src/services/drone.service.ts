import  Drone  from "../models/Drone";
import { Order } from "../models/Order";

export class DroneService {
  static async reportBroken(
    droneId: string,
    lat: number,
    lng: number,
    reason?: string
  ) {
    const drone = await Drone.findById(droneId);
    if (!drone) throw new Error("Drone not found");

    // Release current order
    if (drone.currentOrder) {
      await Order.findByIdAndUpdate(drone.currentOrder, {
        status: "SUBMITTED",
        assignedDrone: null,
        notes: "Released due to drone failure",
      });
    }

    drone.status = "BROKEN";
    drone.currentOrder = null;
    drone.location = { lat, lng };
    drone.lastError = reason || "Reported broken";

    await drone.save();
    return drone;
  }
}
