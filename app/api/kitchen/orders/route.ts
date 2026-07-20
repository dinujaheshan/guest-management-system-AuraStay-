import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { FoodOrderItem } from "@/models/FoodOrderItem";
import { Booking } from "@/models/Booking";
import { Room } from "@/models/Room";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await connectToDatabase();
    
    // Explicitly load models
    const _b = Booking;
    const _r = Room;

    const orders = await FoodOrderItem.find({ status: { $in: ["pending", "served"] } })
      .populate({ path: "bookingId", select: "_id" })
      .populate({ path: "roomId", select: "roomNumber" })
      .sort({ createdAt: 1 });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
