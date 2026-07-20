import mongoose, { Document, Model } from "mongoose";

export interface IRoomPackage extends Document {
  packageName: string;
  description: string;
  roomType: "Standard" | "Deluxe" | "Family";
  category: "AC" | "Non-AC";
  pricePerNight: number;
  includedServices: string[];
  status: "Active" | "Inactive";
}

const RoomPackageSchema = new mongoose.Schema<IRoomPackage>(
  {
    packageName: { type: String, required: true },
    description: { type: String },
    roomType: { type: String, required: true },
    category: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    includedServices: [{ type: String }],
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

export const RoomPackage: Model<IRoomPackage> = mongoose.models.RoomPackage || mongoose.model("RoomPackage", RoomPackageSchema);
