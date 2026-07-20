import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Floor } from "@/models/Floor";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "receptionist") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const floor = await Floor.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    
    if (!floor) return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    return NextResponse.json(floor);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "receptionist") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();
    const floor = await Floor.findByIdAndDelete(params.id);
    
    if (!floor) return NextResponse.json({ error: "Floor not found" }, { status: 404 });
    return NextResponse.json({ message: "Floor deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
