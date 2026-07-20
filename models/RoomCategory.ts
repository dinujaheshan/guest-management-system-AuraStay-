import mongoose, { Document, Model } from "mongoose";

export interface IRoomCategory extends Document {
  name: string; // e.g. "AC", "Non-AC"
  description?: string;
}

const RoomCategorySchema = new mongoose.Schema<IRoomCategory>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const RoomCategory: Model<IRoomCategory> = mongoose.models.RoomCategory || mongoose.model("RoomCategory", RoomCategorySchema);
