import { Schema, model, Document, Types } from 'mongoose';

export type DroneStatus = 'IDLE' | 'BUSY' | 'BROKEN';

export interface IDrone extends Document {
  status: DroneStatus;
  location?: {
    lat: number;
    lng: number;
  };
  batteryLevel?: number;
  currentOrder?: Types.ObjectId | null;
  lastSeenAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DroneSchema = new Schema<IDrone>(
  {
    status: {
      type: String,
      enum: ['IDLE', 'BUSY', 'BROKEN'],
      default: 'IDLE',
      index: true,
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
    currentOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    lastSeenAt: {
      type: Date,
    },
    lastError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Drone = model<IDrone>('Drone', DroneSchema);
