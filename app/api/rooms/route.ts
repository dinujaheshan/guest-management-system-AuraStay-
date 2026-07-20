import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { roomSchema } from "@/lib/validations";
import { Room } from "@/models/Room";

export const GET = apiHandler(async () => {
  const rooms = await Room.find({}).sort({ roomNumber: 1 });
  return NextResponse.json(rooms);
}, { requireAuth: true });

export const POST = apiHandler(async (req, { body }) => {
  const existing = await Room.findOne({ roomNumber: body.roomNumber });
  if (existing) {
    return NextResponse.json({ error: "Room number already exists" }, { status: 400 });
  }

  const room = await Room.create(body);
  return NextResponse.json(room, { status: 201 });
}, { requireAuth: true, requiredRole: ["super_admin", "admin"], schema: roomSchema });
