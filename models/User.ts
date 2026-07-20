import mongoose, { Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "super_admin" | "admin" | "receptionist" | "restaurant_pos";
  status: "active" | "disabled";
  permissions: string[];
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["super_admin", "admin", "receptionist", "restaurant_pos"], default: "receptionist" },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}
export const User: Model<IUser> = mongoose.model("User", UserSchema);
