import mongoose, { Document, Model } from "mongoose";

export interface IGuest extends Document {
  firstName: string;
  lastName: string;
  idPassportNumber?: string;
  phone: string;
  email: string;
  address: string;
  visitCount: number;
}

const GuestSchema = new mongoose.Schema<IGuest>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    idPassportNumber: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    visitCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Guest: Model<IGuest> = mongoose.models.Guest || mongoose.model("Guest", GuestSchema);
