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

    // We do NOT increment booking.advancePayment here. 
    // advancePayment represents ONLY the initial deposit made at booking time.
    // All other payments are tracked via the Payment model and summed up later.
    
    // However, we should still update the booking's payment status if fully paid
    const payments = await Payment.find({ bookingId: booking._id, status: "Paid" });
    const paymentsSum = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = (booking.advancePayment || 0) + paymentsSum;
    
    const paymentStatus = totalPaid >= booking.totalAmount ? "Paid" : "Partially Paid";
    await Booking.findByIdAndUpdate(booking._id, {
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
    
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    
    const query: any = {};
    if (bookingId) query.bookingId = bookingId;

    const payments = await Payment.find(query).populate("bookingId").sort({ createdAt: -1 });
    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
