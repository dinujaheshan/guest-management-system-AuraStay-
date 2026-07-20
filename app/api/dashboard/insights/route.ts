import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Room } from "@/models/Room";
import { Payment } from "@/models/Payment";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await connectToDatabase();

    const now = new Date();
    
    // 1. Analytics & Trends
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current 30 days revenue
    const currentPayments = await Payment.find({ paymentDate: { $gte: thirtyDaysAgo } });
    const currentRevenue = currentPayments.reduce((sum, p) => sum + p.amount, 0);

    // Previous 30 days revenue
    const pastPayments = await Payment.find({ paymentDate: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });
    const pastRevenue = pastPayments.reduce((sum, p) => sum + p.amount, 0);

    let trendPercentage = 0;
    if (pastRevenue > 0) {
      trendPercentage = ((currentRevenue - pastRevenue) / pastRevenue) * 100;
    } else if (currentRevenue > 0) {
      trendPercentage = 100;
    }

    // 2. Occupancy Predictions (Next 7 days)
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const totalRooms = await Room.countDocuments();
    
    // Total potential room nights in next 7 days = totalRooms * 7
    const potentialRoomNights = totalRooms * 7;

    // Find bookings that overlap with the next 7 days
    const upcomingBookings = await Booking.find({
      checkIn: { $lt: next7Days },
      checkOut: { $gt: now },
      status: { $in: ["Confirmed", "Checked In"] }
    });

    let bookedRoomNights = 0;
    upcomingBookings.forEach(booking => {
      // Calculate overlap days for this booking within the next 7 days window
      const start = booking.checkIn > now ? booking.checkIn : now;
      const end = booking.checkOut < next7Days ? booking.checkOut : next7Days;
      const overlapMs = end.getTime() - start.getTime();
      const overlapDays = Math.ceil(overlapMs / (1000 * 60 * 60 * 24));
      
      // Multiply by number of rooms in this booking
      bookedRoomNights += (overlapDays * (booking.rooms?.length || 1));
    });

    const predictedOccupancyRate = potentialRoomNights > 0 
      ? Math.round((bookedRoomNights / potentialRoomNights) * 100) 
      : 0;

    let smartAlert = "Occupancy looks healthy for the next 7 days.";
    if (predictedOccupancyRate < 30) {
      smartAlert = "⚠️ Low occupancy predicted for the next week (" + predictedOccupancyRate + "%). Consider running a promotion or offering discounts!";
    } else if (predictedOccupancyRate > 80) {
      smartAlert = "🔥 High occupancy next week! Ensure housekeeping and staff are fully prepared.";
    }

    // 3. Today's Action Items
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const checkInsToday = await Booking.countDocuments({
      checkIn: { $gte: startOfToday, $lte: endOfToday },
      status: "Confirmed"
    });

    const checkOutsToday = await Booking.countDocuments({
      checkOut: { $gte: startOfToday, $lte: endOfToday },
      status: "Checked In"
    });

    return NextResponse.json({
      revenue: {
        current30Days: currentRevenue,
        past30Days: pastRevenue,
        trendPercentage: trendPercentage.toFixed(1)
      },
      occupancy: {
        predictedRate: predictedOccupancyRate,
        smartAlert
      },
      today: {
        checkIns: checkInsToday,
        checkOuts: checkOutsToday
      }
    });
  } catch (error: any) {
    console.error("Insights Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
