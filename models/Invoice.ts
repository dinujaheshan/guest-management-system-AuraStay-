import mongoose, { Document, Model, Types } from "mongoose";

export interface IInvoice extends Document {
  invoiceNumber: string;
  bookingId: Types.ObjectId;
  guestId: Types.ObjectId;
  roomCharges: number;
  additionalCharges: number;
  foodCharges: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: "Draft" | "Final";
  invoiceDate: Date;
}

const InvoiceSchema = new mongoose.Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", required: true },
    roomCharges: { type: Number, required: true, default: 0 },
    additionalCharges: { type: Number, required: true, default: 0 },
    foodCharges: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    balanceDue: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["Draft", "Final"], default: "Draft" },
    invoiceDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Invoice: Model<IInvoice> = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
