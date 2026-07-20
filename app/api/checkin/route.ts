import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Room } from "@/models/Room";
import { Charge } from "@/models/Charge";
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

    if (booking.status === "Checked In") {
      return NextResponse.json({ error: "Booking is already checked in" }, { status: 400 });
    }

    // 1. Update Booking status
    booking.status = "Checked In";

    // 2. Load Rooms to calculate charges and set Occupied
    const rooms = await Room.find({ _id: { $in: booking.roomIds } });
    
    // Calculate nights
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (nights <= 0) nights = 1;

    let totalRoomCharges = 0;

    // Create a Room Charge for each room
    for (const room of rooms) {
      // Find override price
      const override = booking.roomPrices?.find(
        (rp) => rp.roomId.toString() === room._id.toString()
      );
      const price = override ? override.price : room.pricePerNight;
      const roomChargeAmount = price * nights;
      totalRoomCharges += roomChargeAmount;

      await Charge.create({
        bookingId: booking._id,
        roomId: room._id,
        chargeType: "Room Charge",
        description: `Room Stay Fee - Room ${room.roomNumber} (${nights} night${nights > 1 ? "s" : ""} @ $${price}/night)`,
        amount: roomChargeAmount,
        status: "Pending",
      });

      // Update room status
      room.status = "Occupied";
      await room.save();
    }

    // Update booking totals
    booking.totalAmount = totalRoomCharges;
    
    // Set initial payment status based on advance payment
    if (booking.advancePayment >= booking.totalAmount) {
      booking.paymentStatus = "Paid";
    } else if (booking.advancePayment > 0) {
      booking.paymentStatus = "Partially Paid";
    } else {
      booking.paymentStatus = "Pending";
    }

    await booking.save();

    return NextResponse.json({
      message: "Check-in successful",
      booking,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
