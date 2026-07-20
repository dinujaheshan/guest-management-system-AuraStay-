import mongoose, { Document, Model, Types } from "mongoose";

export interface ICharge extends Document {
  bookingId?: Types.ObjectId;
  roomId?: Types.ObjectId;
  chargeType: "Room Charge" | "Food" | "Laundry" | "Extra Hours" | "Extra Bed" | "Discount/Rebate" | "Other";
  description: string;
  amount: number;
  status: "Pending" | "Added to Bill" | "Paid";
  createdAt: Date;
  updatedAt: Date;
}

const ChargeSchema = new mongoose.Schema<ICharge>(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    chargeType: {
      type: String,
      enum: ["Room Charge", "Food", "Laundry", "Extra Hours", "Extra Bed", "Discount/Rebate", "Other"],
      required: true,
    },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Added to Bill", "Paid"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export const Charge: Model<ICharge> = mongoose.models.Charge || mongoose.model("Charge", ChargeSchema);
