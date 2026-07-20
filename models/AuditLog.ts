import mongoose, { Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: "Create" | "Update" | "Delete";
  module: string;
  description: string;
  createdAt: Date;
}

const AuditLogSchema = new mongoose.Schema<IAuditLog>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["Create", "Update", "Delete"], required: true },
    module: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
