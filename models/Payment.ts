import mongoose, { Document, Model, Types } from "mongoose";

export interface IPayment extends Document {
  bookingId?: Types.ObjectId;
  amount: number;
  paymentMethod: "Cash" | "Card" | "Bank Transfer" | "Mobile Wallet" | "Other";
  status: "Paid" | "Refunded";
  notes?: string;
  date: Date;
}

const PaymentSchema = new mongoose.Schema<IPayment>(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Bank Transfer", "Mobile Wallet", "Other"],
      required: true,
      default: "Cash",
    },
    status: { type: String, enum: ["Paid", "Refunded"], default: "Paid" },
    notes: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

if (mongoose.models.Payment) {
  delete mongoose.models.Payment;
}
export const Payment: Model<IPayment> = mongoose.model("Payment", PaymentSchema);
