import mongoose, { Document, Model } from "mongoose";

export interface IExpense extends Document {
  category: "Electricity" | "Water" | "Internet" | "Maintenance" | "Cleaning" | "Other" | "Utility" | "Salary" | "Food Supplies" | "Marketing";
  amount: number;
  description: string;
  date: Date;
}

const ExpenseSchema = new mongoose.Schema<IExpense>(
  {
    category: {
      type: String,
      enum: ["Electricity", "Water", "Internet", "Maintenance", "Cleaning", "Other", "Utility", "Salary", "Food Supplies", "Marketing"],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
