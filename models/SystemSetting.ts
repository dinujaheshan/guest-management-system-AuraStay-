import mongoose, { Document, Model } from "mongoose";

export interface ISystemSetting extends Document {
  systemName: string;
  defaultCurrency: string;
  timezone: string;
  taxPercentage: number;
  serviceChargePercentage: number;
  allowPosRoomCharges: boolean;
  lateCheckoutPenaltyPerHour: number;
  minAdvancePaymentPercentage: number;
  enableSms: boolean;
  checkInSmsTemplate: string;
  checkOutSmsTemplate: string;
  receptionistCanViewReports: boolean;
}

const SystemSettingSchema = new mongoose.Schema<ISystemSetting>(
  {
    systemName: { type: String, default: "GHRMS" },
    defaultCurrency: { type: String, default: "LKR" },
    timezone: { type: String, default: "Asia/Colombo" },
    taxPercentage: { type: Number, default: 0 },
    serviceChargePercentage: { type: Number, default: 0 },
    allowPosRoomCharges: { type: Boolean, default: true },
    lateCheckoutPenaltyPerHour: { type: Number, default: 0 },
    minAdvancePaymentPercentage: { type: Number, default: 30 },
    enableSms: { type: Boolean, default: false },
    checkInSmsTemplate: { type: String, default: "Hi [GuestName], welcome to our hotel! Your check-in is complete." },
    checkOutSmsTemplate: { type: String, default: "Hi [GuestName], thank you for staying with us! Safe travels." },
    receptionistCanViewReports: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SystemSetting: Model<ISystemSetting> = mongoose.models.SystemSetting || mongoose.model("SystemSetting", SystemSettingSchema);
