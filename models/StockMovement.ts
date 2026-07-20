import mongoose, { Document, Model } from "mongoose";

export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId;
  type: "in" | "out";
  quantity: number;
  reason: "sale" | "purchase" | "adjustment";
  date: Date;
}

const StockMovementSchema = new mongoose.Schema<IStockMovement>(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    type: { type: String, enum: ["in", "out"], required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, enum: ["sale", "purchase", "adjustment"], required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const StockMovement: Model<IStockMovement> = mongoose.models.StockMovement || mongoose.model("StockMovement", StockMovementSchema);
