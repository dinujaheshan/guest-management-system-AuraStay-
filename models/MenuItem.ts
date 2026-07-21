import mongoose, { Document, Model } from "mongoose";

export interface IMenuItem extends Document {
  itemName: string;
  category: "Food" | "Beverage" | "Product" | "Service";
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  isInventoryTracked: boolean;
}

const MenuItemSchema = new mongoose.Schema<IMenuItem>(
  {
    itemName: { type: String, required: true },
    category: { type: String, required: true, enum: ["Food", "Beverage", "Product", "Service"] },
    price: { type: Number, required: true },
    stockQuantity: { type: Number, default: 0 },
    imageUrl: { type: String },
    isInventoryTracked: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MenuItem: Model<IMenuItem> = mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);
