import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { RoomPackage } from "@/models/RoomPackage";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    let packages = await RoomPackage.find({}).sort({ createdAt: -1 });
    
    if (packages.length === 0) {
      packages = await RoomPackage.create([
        {
          packageName: "Standard Non-AC Package",
          description: "Economy choice stay package",
          roomType: "Standard",
          category: "Non-AC",
          pricePerNight: 50,
          includedServices: ["Free WiFi", "Morning Tea"],
          status: "Active",
        },
        {
          packageName: "Deluxe AC Package",
          description: "Premium stay with central cooling",
          roomType: "Deluxe",
          category: "AC",
          pricePerNight: 100,
          includedServices: ["Breakfast Included", "Free WiFi", "Laundry 1 bag"],
          status: "Active",
        },
        {
          packageName: "Family AC Premium Package",
          description: "Full suite lodging for families",
          roomType: "Family",
          category: "AC",
          pricePerNight: 200,
          includedServices: ["Breakfast & Dinner", "Free WiFi", "Laundry service", "Late Checkout"],
          status: "Active",
        },
      ]);
    }
    
    return NextResponse.json(packages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "receptionist") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const pkg = await RoomPackage.create(body);
    return NextResponse.json(pkg, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
