import mongoose, { Document, Model } from "mongoose";

export interface IRoom extends Document {
  roomNumber: string;
  roomType: "Standard" | "Deluxe" | "Family";
  category: "AC" | "Non-AC";
  floor: string;
  capacity: number;
  pricePerNight: number;
  status: "Available" | "Reserved" | "Occupied" | "Cleaning" | "Maintenance";
}

const RoomSchema = new mongoose.Schema<IRoom>(
  {
    roomNumber: { type: String, required: true, unique: true },
    roomType: { type: String, required: true },
    category: { type: String, required: true },
    floor: { type: String, required: true },
    capacity: { type: Number, required: true },
    pricePerNight: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["Available", "Reserved", "Occupied", "Cleaning", "Maintenance"], 
      default: "Available" 
    },
  },
  { timestamps: true }
);

export const Room: Model<IRoom> = mongoose.models.Room || mongoose.model("Room", RoomSchema);
