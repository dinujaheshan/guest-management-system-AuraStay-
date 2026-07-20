import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Payment } from "@/models/Payment";
import { Booking } from "@/models/Booking";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await connectToDatabase();
    const body = await req.json();

    const booking = await Booking.findById(body.bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const payment = await Payment.create({
      bookingId: body.bookingId,
      amount: body.amount,
      paymentMethod: body.paymentMethod || "Cash",
      notes: body.notes
    });

    const newAdvance = (booking.advancePayment || 0) + body.amount;
    const paymentStatus = newAdvance >= booking.totalAmount ? "Paid" : "Partially Paid";

    await Booking.findByIdAndUpdate(booking._id, {
      advancePayment: newAdvance,
      paymentStatus: paymentStatus
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const payments = await Payment.find({}).populate("bookingId").sort({ createdAt: -1 });
    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
