import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { RoomType } from "@/models/RoomType";
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
    const type = await RoomType.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    
    if (!type) return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    return NextResponse.json(type);
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
    const type = await RoomType.findByIdAndDelete(params.id);
    
    if (!type) return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    return NextResponse.json({ message: "Room type deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
