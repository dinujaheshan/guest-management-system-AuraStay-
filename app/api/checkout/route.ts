import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Room } from "@/models/Room";
import { Charge } from "@/models/Charge";
import { Payment } from "@/models/Payment";
import { Invoice } from "@/models/Invoice";
import { Guest } from "@/models/Guest";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "Checked In") {
      return NextResponse.json({ error: "Booking is not checked in" }, { status: 400 });
    }

    // 1. Calculate Charges and Breakdowns for Invoice
    const charges = await Charge.find({ bookingId: booking._id });
    const additionalRoomChargesSum = charges
      .filter((c) => c.chargeType === "Room Charge")
      .reduce((sum, c) => sum + c.amount, 0);
    const foodChargesSum = charges
      .filter((c) => c.chargeType === "Food")
      .reduce((sum, c) => sum + c.amount, 0);
    const additionalChargesSum = charges
      .filter((c) => !["Room Charge", "Food"].includes(c.chargeType))
      .reduce((sum, c) => sum + c.amount, 0);

    // The booking's totalAmount is the source of truth for the grand total.
    // It includes the base room rate (set at booking) + any extra charges added via /api/charges.
    const totalCharges = booking.totalAmount;
    
    // To properly display room charges on the invoice, we infer the base room rate:
    const baseRoomRate = totalCharges - (additionalRoomChargesSum + foodChargesSum + additionalChargesSum);
    const totalRoomCharges = baseRoomRate + additionalRoomChargesSum;

    // 2. Calculate Payments
    const payments = await Payment.find({ bookingId: booking._id, status: "Paid" });
    const paymentsSum = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = (booking.advancePayment || 0) + paymentsSum;
    const balanceDue = totalCharges - totalPaid;

    if (balanceDue > 0.01) {
      return NextResponse.json({ error: `Cannot complete checkout. There is an outstanding balance of $${balanceDue.toFixed(2)}.` }, { status: 400 });
    }

    // 3. Update Booking
    booking.status = "Checked Out";
    booking.paymentStatus = "Paid";
    await booking.save();

    // 4. Update Rooms to Cleaning
    await Room.updateMany(
      { _id: { $in: booking.roomIds } },
      { $set: { status: "Cleaning" } }
    );

    // 5. Generate Invoice
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice = await Invoice.create({
      invoiceNumber,
      bookingId: booking._id,
      guestId: booking.guestId,
      roomCharges: totalRoomCharges,
      foodCharges: foodChargesSum,
      additionalCharges: additionalChargesSum,
      totalAmount: totalCharges,
      paidAmount: totalPaid,
      balanceDue: balanceDue > 0 ? balanceDue : 0,
      status: "Final",
      invoiceDate: new Date(),
    });

    // 6. Update Guest Visit Count
    const guest = await Guest.findById(booking.guestId);
    if (guest) {
      guest.visitCount = (guest.visitCount || 0) + 1;
      await guest.save();
    }

    return NextResponse.json({
      message: "Check-out successful",
      booking,
      invoice,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
