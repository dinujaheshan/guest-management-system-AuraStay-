import mongoose, { Document, Model } from "mongoose";

export interface IFloor extends Document {
  name: string; // e.g. "1st Floor"
  description?: string;
}

const FloorSchema = new mongoose.Schema<IFloor>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const Floor: Model<IFloor> = mongoose.models.Floor || mongoose.model("Floor", FloorSchema);
