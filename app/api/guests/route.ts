import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { guestSchema } from "@/lib/validations";
import { Guest } from "@/models/Guest";
import { Booking } from "@/models/Booking";

export const GET = apiHandler(async () => {
  const guests = await Guest.find({}).sort({ createdAt: -1 }).lean();
  
  // Look up active bookings for these guests
  const activeBookings = await Booking.find({ status: "Checked In" }).select("guestId").lean();
  const activeGuestIds = new Set(activeBookings.map((b: any) => b.guestId.toString()));

  const enrichedGuests = guests.map((g: any) => ({
    ...g,
    currentStatus: activeGuestIds.has(g._id.toString()) ? "Checked In" : "Checked Out"
  }));

  return NextResponse.json(enrichedGuests);
}, { requireAuth: true });

export const POST = apiHandler(async (req, { body }) => {
  if (body.idPassportNumber && body.idPassportNumber.trim() !== "") {
    const existing = await Guest.findOne({ idPassportNumber: body.idPassportNumber });
    if (existing) {
      return NextResponse.json({ error: "ID/Passport number already exists" }, { status: 400 });
    }
  }

  const guest = await Guest.create(body);
  return NextResponse.json(guest, { status: 201 });
}, { requireAuth: true, schema: guestSchema });
