// User Model
import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserType } from '../types';

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: Object.values(UserType),
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });

export const User = mongoose.model<IUser>('User', userSchema);

// Drone Model
import { IDrone, DroneStatus, Location } from '../types';

const locationSchema = new Schema<Location>({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  address: {
    type: String,
    trim: true
  }
});

const droneSchema = new Schema<IDrone>({
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  model: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(DroneStatus),
    default: DroneStatus.IDLE
  },
  location: {
    type: locationSchema,
    required: true
  },
  batteryLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 100
  },
  currentOrder: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  assignedJobs: [{
    type: Schema.Types.ObjectId,
    ref: 'Job'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

droneSchema.index({ location: '2dsphere' });
droneSchema.index({ status: 1 });
droneSchema.index({ lastHeartbeat: 1 });

export const Drone = mongoose.model<IDrone>('Drone', droneSchema);

// Order Model
import { IOrder, OrderStatus } from '../types';

const orderSchema = new Schema<IOrder>({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  drone: {
    type: Schema.Types.ObjectId,
    ref: 'Drone'
  },
  origin: {
    type: locationSchema,
    required: true
  },
  destination: {
    type: locationSchema,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  weight: {
    type: Number,
    required: true,
    min: 0.1,
    max: 10 // kg
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isHandoffJob: {
    type: Boolean,
    default: false
  },
  originalDrone: {
    type: Schema.Types.ObjectId,
    ref: 'Drone'
  },
  handoffCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

orderSchema.index({ status: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ drone: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ origin: '2dsphere' });
orderSchema.index({ destination: '2dsphere' });

export const Order = mongoose.model<IOrder>('Order', orderSchema);

// Job Model (for handoffs)
import { IJob } from '../types';

const jobSchema = new Schema<IJob>({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  drone: {
    type: Schema.Types.ObjectId,
    ref: 'Drone'
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'completed', 'failed'],
    default: 'available'
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  pickupLocation: {
    type: locationSchema,
    required: true
  },
  dropoffLocation: {
    type: locationSchema,
    required: true
  }
}, {
  timestamps: true
});

jobSchema.index({ status: 1, priority: -1 });
jobSchema.index({ drone: 1 });

export const Job = mongoose.model<IJob>('Job', jobSchema);