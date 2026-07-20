import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { InventoryService } from "@/modules/inventory/inventory.service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { bookingId, menuItemId, quantity, roomId, payNow, paymentMethod } = await req.json();
    const result = await InventoryService.placeFoodOrder(bookingId, menuItemId, quantity, roomId, payNow, paymentMethod);

    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes("not found") ? 404 : (error.message.includes("parameters") || error.message.includes("Insufficient")) ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
