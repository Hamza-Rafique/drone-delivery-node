import { Schema, model, Document, Types } from 'mongoose';

export interface IJob extends Document {
  orderId: Types.ObjectId;
  fromDrone: Types.ObjectId;
  pickupLocation: {
    lat: number;
    lng: number;
  };
  status: 'OPEN' | 'TAKEN' | 'COMPLETED';
}

const JobSchema = new Schema<IJob>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    fromDrone: { type: Schema.Types.ObjectId, ref: 'Drone', required: true },
    pickupLocation: { lat: Number, lng: Number },
    status: {
      type: String,
      enum: ['OPEN', 'TAKEN', 'COMPLETED'],
      default: 'OPEN',
    },
  },
  { timestamps: true }
);

export default model<IJob>('Job', JobSchema);
