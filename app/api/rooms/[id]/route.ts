import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { roomSchema } from "@/lib/validations";
import { Room } from "@/models/Room";

export const GET = apiHandler(async (req, { params }) => {
  const room = await Room.findById(params.id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(room);
}, { requireAuth: true });

export const PUT = apiHandler(async (req, { params, body }) => {
  const room = await Room.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(room);
}, { requireAuth: true, requiredRole: ["super_admin", "admin"], schema: roomSchema });

export const DELETE = apiHandler(async (req, { params }) => {
  const room = await Room.findByIdAndDelete(params.id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json({ message: "Room deleted successfully" });
}, { requireAuth: true, requiredRole: ["super_admin", "admin"] });
