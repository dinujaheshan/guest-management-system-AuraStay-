import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Charge } from "@/models/Charge";
import { Expense } from "@/models/Expense";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await connectToDatabase();

    // Export Finance summary as CSV for now
    const expenses = await Expense.find({});
    const bookings = await Booking.find({});
    const charges = await Charge.find({});

    let csv = "Type,Amount,Date,Description\n";

    bookings.forEach(b => {
      csv += `Booking Revenue,${b.totalAmount},${b.createdAt.toISOString().split('T')[0]},${b.bookingCode}\n`;
    });

    charges.forEach(c => {
      csv += `Charge (${c.chargeType}),${c.amount},${c.createdAt.toISOString().split('T')[0]},${c.description}\n`;
    });

    expenses.forEach(e => {
      csv += `Expense (${e.category}),-${e.amount},${e.date.toISOString().split('T')[0]},${e.description}\n`;
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ghrms_finance_report_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
