import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { Charge } from "@/models/Charge";
import { Booking } from "@/models/Booking";

export const DELETE = apiHandler(async (req, { params }) => {
  const charge = await Charge.findById(params.id);
  if (!charge) return NextResponse.json({ error: "Charge not found" }, { status: 404 });

  // Update booking total amount to reverse the charge
  if (charge.bookingId) {
    const booking = await Booking.findById(charge.bookingId);
    if (booking) {
      booking.totalAmount = (booking.totalAmount || 0) - charge.amount;
      await booking.save();
    }
  }

  await Charge.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "Charge deleted successfully" });
}, { requireAuth: true, requiredRole: ["super_admin", "admin"] });
