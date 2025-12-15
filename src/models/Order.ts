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
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  destination: {
    type: 'Point';
    coordinates: [number, number];
  };
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: OrderStatus;
  assignedDrone?: Types.ObjectId | null;
}

const GeoPoint = {
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number], // [lng, lat]
    required: true,
  },
};

const OrderSchema = new Schema<IOrder>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    origin: GeoPoint,
    destination: GeoPoint,
    currentLocation: GeoPoint,

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
  },
  { timestamps: true }
);

// 📌 Geospatial indexes
OrderSchema.index({ origin: '2dsphere' });
OrderSchema.index({ destination: '2dsphere' });
OrderSchema.index({ currentLocation: '2dsphere' });

// 📌 Performance indexes
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdBy: 1 });

export default model<IOrder>('Order', OrderSchema);
