import mongoose, { Document, Model } from "mongoose";

export interface IRoomType extends Document {
  name: string; // e.g. "Standard"
  capacity: number;
  defaultPrice: number;
}

const RoomTypeSchema = new mongoose.Schema<IRoomType>(
  {
    name: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true, default: 2 },
    defaultPrice: { type: Number, required: true, default: 100 },
  },
  { timestamps: true }
);

export const RoomType: Model<IRoomType> = mongoose.models.RoomType || mongoose.model("RoomType", RoomTypeSchema);
