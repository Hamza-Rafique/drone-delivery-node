import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'enduser', 'drone'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for name and role if needed
UserSchema.index({ name: 1, role: 1 });

export default mongoose.model<IUser>('User', UserSchema);