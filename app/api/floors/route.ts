import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Floor } from "@/models/Floor";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const floors = await Floor.find({}).sort({ name: 1 });
    return NextResponse.json(floors);
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
    const floor = await Floor.create(body);
    return NextResponse.json(floor, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
