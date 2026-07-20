import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { bookingSchema } from "@/lib/validations";
import { Booking } from "@/models/Booking";
import { Room } from "@/models/Room";

export const GET = apiHandler(async (req, { params }) => {
  const booking = await Booking.findById(params.id)
    .populate("guestId")
    .populate("roomIds")
    .populate("packageId");

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  return NextResponse.json(booking);
}, { requireAuth: true });

export const PUT = apiHandler(async (req, { params, body }) => {
  const oldBooking = await Booking.findById(params.id);
  if (!oldBooking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const booking = await Booking.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Handle status transitions for Room statuses
  const statusChanged = oldBooking.status !== booking.status;
  const roomsChanged = JSON.stringify(oldBooking.roomIds) !== JSON.stringify(booking.roomIds);

  if (statusChanged || roomsChanged) {
    // 1. Release old rooms
    await Room.updateMany(
      { _id: { $in: oldBooking.roomIds } },
      { $set: { status: "Available" } }
    );

    // 2. Update new rooms according to the new booking status
    if (["Reserved", "Confirmed"].includes(booking.status)) {
      await Room.updateMany(
        { _id: { $in: booking.roomIds } },
        { $set: { status: "Reserved" } }
      );
    } else if (booking.status === "Checked In") {
      await Room.updateMany(
        { _id: { $in: booking.roomIds } },
        { $set: { status: "Occupied" } }
      );
    } else if (booking.status === "Checked Out") {
      await Room.updateMany(
        { _id: { $in: booking.roomIds } },
        { $set: { status: "Cleaning" } }
      );
    } else if (["Cancelled", "No Show"].includes(booking.status)) {
      await Room.updateMany(
        { _id: { $in: booking.roomIds } },
        { $set: { status: "Available" } }
      );
    }
  }

  return NextResponse.json(booking);
}, { requireAuth: true, schema: bookingSchema });

export const DELETE = apiHandler(async (req, { params }) => {
  const booking = await Booking.findById(params.id);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Release rooms
  await Room.updateMany(
    { _id: { $in: booking.roomIds } },
    { $set: { status: "Available" } }
  );

  await Booking.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "Booking deleted successfully" });
}, { requireAuth: true, requiredRole: ["super_admin", "admin"] });
