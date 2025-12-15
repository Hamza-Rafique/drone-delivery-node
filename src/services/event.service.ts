import { EventEmitter } from "events";

export const eventBus = new EventEmitter();

// Example: emit order completed
eventBus.emit("orderCompleted", { orderId, droneId });
