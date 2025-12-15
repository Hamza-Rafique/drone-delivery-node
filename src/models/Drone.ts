import { Schema, model, Document, Types } from 'mongoose';

export type DroneStatus = 'IDLE' | 'BUSY' | 'BROKEN';

export interface IDrone extends Document {
  userId: Types.ObjectId;
  status: DroneStatus;
  location: {
    lat: number;
    lng: number;
  };
  batteryLevel: number;
  currentOrder?: Types.ObjectId | null;
  lastSeenAt?: Date;
}

const DroneSchema = new Schema<IDrone>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['IDLE', 'BUSY', 'BROKEN'],
      default: 'IDLE',
    },
    location: {
      lat: Number,
      lng: Number,
    },
    batteryLevel: { type: Number, default: 100 },
    currentOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    lastSeenAt: Date,
  },
  { timestamps: true }
);

export default model<IDrone>('Drone', DroneSchema);
