import mongoose, { Document, Model } from "mongoose";

export interface IBusinessSetting extends Document {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  checkInTime: string;
  checkOutTime: string;
  invoiceFooterText: string;
}

const BusinessSettingSchema = new mongoose.Schema<IBusinessSetting>(
  {
    businessName: { type: String, default: "My Guest House" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    logo: { type: String },
    checkInTime: { type: String, default: "14:00" },
    checkOutTime: { type: String, default: "11:00" },
    invoiceFooterText: { type: String, default: "Thank you for your stay!" },
  },
  { timestamps: true }
);

export const BusinessSetting: Model<IBusinessSetting> = mongoose.models.BusinessSetting || mongoose.model("BusinessSetting", BusinessSettingSchema);
