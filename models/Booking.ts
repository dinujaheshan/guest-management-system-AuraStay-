import mongoose, { Document, Model, Types } from "mongoose";

export interface IBooking extends Document {
  guestId: Types.ObjectId;
  roomIds: Types.ObjectId[];
  packageId?: Types.ObjectId;
  roomPrices: { roomId: Types.ObjectId; price: number }[];
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  status: "Reserved" | "Confirmed" | "Checked In" | "Checked Out" | "Cancelled" | "No Show";
  advancePayment: number;
  totalAmount: number;
  paymentStatus: "Pending" | "Partially Paid" | "Paid" | "Refunded";
}

const BookingSchema = new mongoose.Schema<IBooking>(
  {
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", required: true },
    roomIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true }],
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "RoomPackage" },
    roomPrices: [
      {
        roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
        price: { type: Number, required: true },
      },
    ],
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    numberOfGuests: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Reserved", "Confirmed", "Checked In", "Checked Out", "Cancelled", "No Show"],
      default: "Reserved",
    },
    advancePayment: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Partially Paid", "Paid", "Refunded"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model("Booking", BookingSchema);

