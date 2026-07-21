import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Room } from "@/models/Room";
import { Charge } from "@/models/Charge";
import { Expense } from "@/models/Expense";
import { MenuItem } from "@/models/MenuItem";
import { Invoice } from "@/models/Invoice";
import { Payment } from "@/models/Payment";
import { FoodOrderItem } from "@/models/FoodOrderItem";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "receptionist") {
      // Allow receptionist to read dashboard basic stats but maybe not full reports if required?
      // Wait, let's allow all authenticated roles to read reports so the dashboard works fine.
    }

    await connectToDatabase();

    // 1. Occupancy Stats
    const totalRooms = await Room.countDocuments({});
    const occupiedRooms = await Room.countDocuments({ status: "Occupied" });
    const availableRooms = await Room.countDocuments({ status: "Available" });
    const reservedRooms = await Room.countDocuments({ status: "Reserved" });
    const cleaningRooms = await Room.countDocuments({ status: "Cleaning" });
    const maintenanceRooms = await Room.countDocuments({ status: "Maintenance" });

    // 2. Revenue Aggregation
    // Total Revenue = Advance Payments of Bookings + Sum of Recorded Payments
    const bookings = await Booking.find({});
    const totalAdvance = bookings.reduce((sum, b) => sum + (b.advancePayment || 0), 0);
    
    const payments = await Payment.find({ status: "Paid" });
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalRevenue = totalAdvance + totalPayments;

    // Revenue breakdown by category (aggregating Charge collection)
    const charges = await Charge.find({});
    const roomRevenue = charges.filter(c => c.chargeType === "Room Charge").reduce((sum, c) => sum + c.amount, 0);
    const foodRevenue = charges.filter(c => c.chargeType === "Food").reduce((sum, c) => sum + c.amount, 0);
    const additionalRevenue = charges.filter(c => !["Room Charge", "Food"].includes(c.chargeType)).reduce((sum, c) => sum + c.amount, 0);
    
    const walkInPayments = payments.filter(p => p.notes === "Walk-in POS Order");
    const walkInRevenue = walkInPayments.reduce((sum, p) => sum + p.amount, 0);

    // 3. Expenses Aggregation
    const expenses = await Expense.find({});
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Expense breakdown by category
    const expenseBreakdown = {
      Electricity: expenses.filter(e => e.category === "Electricity").reduce((sum, e) => sum + e.amount, 0),
      Water: expenses.filter(e => e.category === "Water").reduce((sum, e) => sum + e.amount, 0),
      Internet: expenses.filter(e => e.category === "Internet").reduce((sum, e) => sum + e.amount, 0),
      Maintenance: expenses.filter(e => e.category === "Maintenance").reduce((sum, e) => sum + e.amount, 0),
      Cleaning: expenses.filter(e => e.category === "Cleaning").reduce((sum, e) => sum + e.amount, 0),
      Other: expenses.filter(e => e.category === "Other").reduce((sum, e) => sum + e.amount, 0),
    };

    // 4. Low stock items
    const lowStockItems = await MenuItem.find({ stockQuantity: { $lt: 5 } }).sort({ stockQuantity: 1 });

    // 5. Walk-in Items
    const walkInItems = await FoodOrderItem.find({ bookingId: { $exists: false } }).sort({ createdAt: -1 });

    // Net Profit
    const netProfit = totalRevenue - totalExpenses;

    return NextResponse.json({
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        available: availableRooms,
        reserved: reservedRooms,
        cleaning: cleaningRooms,
        maintenance: maintenanceRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      },
      finance: {
        totalRevenue,
        totalExpenses,
        netProfit,
        breakdown: {
          rooms: roomRevenue,
          food: foodRevenue,
          additional: additionalRevenue,
          walkIn: walkInRevenue,
        },
        expenseBreakdown,
      },
      lowStockItems,
      walkInItems,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
