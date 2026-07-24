import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Guest } from "@/models/Guest";
import { Room } from "@/models/Room";
import { RoomPackage } from "@/models/RoomPackage";
import { Payment } from "@/models/Payment";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    // Explicitly reference models to register them in Mongoose schemas (prevents SchemaNotFound errors)
    const _g = Guest;
    const _r = Room;
    const _rp = RoomPackage;
    const _p = Payment;

    const bookingId = params.id;
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId)
      .populate("guestId")
      .populate("roomIds")
      .populate("packageId");

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const payments = await Payment.find({ bookingId }).sort({ date: 1 });

    const { BusinessSetting } = await import("@/models/BusinessSetting");
    const businessSettings = await BusinessSetting.findOne() || {
      businessName: "My Guest House",
      logo: "",
      checkInTime: "14:00",
      checkOutTime: "11:00",
      invoiceFooterText: "Thank you for your stay!"
    };

    return NextResponse.json({
      booking,
      payments,
      businessSettings,
    });
  } catch (error: any) {
    console.error("Public API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
