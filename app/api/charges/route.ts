import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { chargeSchema } from "@/lib/validations";
import { Charge } from "@/models/Charge";
import { Booking } from "@/models/Booking";

export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");

  const query: any = {};
  if (bookingId) query.bookingId = bookingId;

  const charges = await Charge.find(query).sort({ createdAt: -1 });
  return NextResponse.json(charges);
}, { requireAuth: true });

export const POST = apiHandler(async (req, { body }) => {
  const charge = await Charge.create(body);

  // Update booking total amount in real-time
  if (body.bookingId) {
    const booking = await Booking.findById(body.bookingId);
    if (booking) {
      booking.totalAmount = (booking.totalAmount || 0) + Number(body.amount);
      await booking.save();
    }
  }

  return NextResponse.json(charge, { status: 201 });
}, { requireAuth: true, schema: chargeSchema });
