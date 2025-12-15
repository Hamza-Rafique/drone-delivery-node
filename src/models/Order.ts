import { Schema, model, Document, Types } from 'mongoose';

// Interface for TypeScript
export interface IOrder extends Document {
  user: Types.ObjectId;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  status: 'SUBMITTED' | 'RESERVED' | 'PICKED' | 'DELIVERED' | 'FAILED';
  assignedDrone?: Types.ObjectId | null;
  timeline: { status: string; timestamp: Date }[];
  currentLocation?: { lat: number; lng: number };
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    origin: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    destination: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    status: { type: String, required: true, default: 'SUBMITTED' },
    assignedDrone: { type: Schema.Types.ObjectId, ref: 'Drone', default: null },
    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    currentLocation: {
      lat: Number,
      lng: Number,
    },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

// Export the model
export const Order = model<IOrder>('Order', orderSchema);
