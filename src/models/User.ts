import { Schema, model, Document } from "mongoose";

export type UserRole = "ADMIN" | "ENDUSER" | "DRONE";

export interface IUser extends Document {
  name: string;
  role: UserRole;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "ENDUSER", "DRONE"],
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IUser>("User", UserSchema);
