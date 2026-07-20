import mongoose, { Document, Model } from "mongoose";

export interface IStaffUser extends Document {
  name: string;
  phone: string;
  role: "receptionist" | "cleaner" | "manager" | "kitchen";
  shift: "morning" | "evening" | "night";
  status: "active" | "inactive";
}

const StaffUserSchema = new mongoose.Schema<IStaffUser>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true, enum: ["receptionist", "cleaner", "manager", "kitchen"] },
    shift: { type: String, required: true, enum: ["morning", "evening", "night"] },
    status: { type: String, default: "active", enum: ["active", "inactive"] },
  },
  { timestamps: true }
);

export const StaffUser: Model<IStaffUser> = mongoose.models.StaffUser || mongoose.model("StaffUser", StaffUserSchema);
