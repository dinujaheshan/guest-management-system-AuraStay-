import { Booking } from "@/models/Booking";
import { Room } from "@/models/Room";
import { Guest } from "@/models/Guest";
import { RoomPackage } from "@/models/RoomPackage";
import { sendSMS } from "@/lib/sms";
import connectToDatabase from "@/lib/db";

export class BookingService {
  static async getAllBookings() {
    await connectToDatabase();
    // Explicitly load models
    const _g = Guest;
    const _r = Room;
    const _rp = RoomPackage;

    return await Booking.find({})
      .populate("guestId")
      .populate("roomIds")
      .populate("packageId")
      .sort({ createdAt: -1 });
  }

  static async createBooking(body: any) {
    await connectToDatabase();
    
    // 1. Create Booking
    const booking = await Booking.create(body);

    // 2. If status is Reserved or Confirmed, update rooms status to "Reserved"
    if (["Reserved", "Confirmed"].includes(booking.status)) {
      await Room.updateMany(
        { _id: { $in: booking.roomIds } },
        { $set: { status: "Reserved" } }
      );
    }

    // 3. Send SMS confirmation to Guest with Public URL link
    try {
      const guest = await Guest.findById(booking.guestId);
      if (guest && guest.phone) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const checkIn = new Date(booking.checkInDate).toLocaleDateString();
        const checkOut = new Date(booking.checkOutDate).toLocaleDateString();
        const message = `Hi ${guest.firstName}, your booking is ${booking.status}. Check-in: ${checkIn}, Check-out: ${checkOut}. View details & payments: ${appUrl}/public/bookings/${booking._id}`;
        await sendSMS(guest.phone, message);
      }
    } catch (smsError) {
      console.error("SMS notification failed to trigger:", smsError);
    }

    return booking;
  }
}
