import { Schema, model, Document, Types } from "mongoose";

export type OrderStatus =
  | "SUBMITTED"
  | "RESERVED"
  | "PICKED"
  | "DELIVERED"
  | "FAILED"
  | "PENDING";

export interface IOrder extends Document {
  origin: {
    lat: number;
    lng: number;
  };
  destination: {
    lat: number;
    lng: number;
  };
  currentLocation?: {
    lat: number;
    lng: number;
  };
  status: OrderStatus;
  assignedDrone?: Types.ObjectId | null;
  notes?: string | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    origin: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    destination: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "RESERVED", "PICKED", "DELIVERED", "FAILED"],
      default: "SUBMITTED",
      index: true,
    },
    assignedDrone: {
      type: Schema.Types.ObjectId,
      ref: "Drone",
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = model<IOrder>("Order", OrderSchema);
