import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { apiHandler } from "@/lib/api-handler";
import { bookingSchema } from "@/lib/validations";
import { BookingService } from "@/modules/booking/booking.service";

export const GET = apiHandler(async () => {
  const bookings = await BookingService.getAllBookings();
  return NextResponse.json(bookings);
}, { requireAuth: true });

export const POST = apiHandler(async (req, { body }) => {
  console.log("POST /api/bookings received payload");
  const booking = await BookingService.createBooking(body);
  return NextResponse.json(booking, { status: 201 });
}, { requireAuth: true, schema: bookingSchema });
