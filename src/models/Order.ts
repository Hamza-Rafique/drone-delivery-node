import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus =
  | 'SUBMITTED'
  | 'RESERVED'
  | 'PICKED'
  | 'DELIVERED'
  | 'FAILED';

export interface IOrder extends Document {
  createdBy: Types.ObjectId;
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
  notes?: string;
}

const OrderSchema = new Schema<IOrder>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    origin: { lat: Number, lng: Number },
    destination: { lat: Number, lng: Number },
    currentLocation: { lat: Number, lng: Number },
    status: {
      type: String,
      enum: ['SUBMITTED', 'RESERVED', 'PICKED', 'DELIVERED', 'FAILED'],
      default: 'SUBMITTED',
    },
    assignedDrone: {
      type: Schema.Types.ObjectId,
      ref: 'Drone',
      default: null,
    },
    notes: String,
  },
  { timestamps: true }
);

export default model<IOrder>('Order', OrderSchema);
