import mongoose, { Document, Model } from "mongoose";

export interface IFoodOrderItem extends Document {
  bookingId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  menuItemId: mongoose.Types.ObjectId;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: "pending" | "served" | "billed";
}

const FoodOrderItemSchema = new mongoose.Schema<IFoodOrderItem>(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ["pending", "served", "billed"], default: "pending" },
  },
  { timestamps: true }
);

export const FoodOrderItem: Model<IFoodOrderItem> = mongoose.models.FoodOrderItem || mongoose.model("FoodOrderItem", FoodOrderItemSchema);
