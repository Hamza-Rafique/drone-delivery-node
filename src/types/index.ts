import { Request } from 'express';
import { Types } from 'mongoose';

export interface JwtPayload {
  userId: string;
  userType: UserType;
  email?: string;
}

export enum UserType {
  ADMIN = 'admin',
  ENDUSER = 'enduser',
  DRONE = 'drone'
}

export enum OrderStatus {
  PENDING = 'pending',
  RESERVED = 'reserved',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  WITHDRAWN = 'withdrawn'
}

export enum DroneStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  BROKEN = 'broken',
  CHARGING = 'charging',
  MAINTENANCE = 'maintenance'
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  userType: UserType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDrone {
  _id: Types.ObjectId;
  serialNumber: string;
  model: string;
  status: DroneStatus;
  location: Location;
  batteryLevel: number;
  currentOrder?: Types.ObjectId | IOrder;
  assignedJobs: Types.ObjectId[];
  isActive: boolean;
  lastHeartbeat: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder {
  _id: Types.ObjectId;
  orderId: string;
  user: Types.ObjectId | IUser;
  drone?: Types.ObjectId | IDrone;
  origin: Location;
  destination: Location;
  status: OrderStatus;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  weight: number;
  priority: 'low' | 'medium' | 'high';
  isHandoffJob: boolean;
  originalDrone?: Types.ObjectId;
  handoffCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJob {
  _id: Types.ObjectId;
  order: Types.ObjectId | IOrder;
  drone: Types.ObjectId | IDrone;
  status: 'available' | 'reserved' | 'completed' | 'failed';
  priority: number;
  pickupLocation: Location;
  dropoffLocation: Location;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}