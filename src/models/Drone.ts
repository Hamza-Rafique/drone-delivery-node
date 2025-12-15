import { Schema, model, Document, Types } from 'mongoose';

export type DroneStatus = 'IDLE' | 'BUSY' | 'BROKEN';

export interface IDrone extends Document {
  userId: Types.ObjectId;
  status: DroneStatus;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  currentOrder?: Types.ObjectId | null;
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
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },

    currentOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
  },
  { timestamps: true }
);

// 📌 Indexes
DroneSchema.index({ location: '2dsphere' });
DroneSchema.index({ status: 1 });

export default model<IDrone>('Drone', DroneSchema);
