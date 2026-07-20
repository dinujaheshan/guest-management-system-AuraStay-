import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { Guest } from "@/models/Guest";
import { Booking } from "@/models/Booking";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // Force load refs
    const _g = Guest;
    const _b = Booking;

    const invoices = await Invoice.find({})
      .populate("guestId")
      .populate("bookingId")
      .sort({ createdAt: -1 });

    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
