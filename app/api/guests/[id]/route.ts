import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { guestSchema } from "@/lib/validations";
import { Guest } from "@/models/Guest";

export const GET = apiHandler(async (req, { params }) => {
  const guest = await Guest.findById(params.id);
  if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  return NextResponse.json(guest);
}, { requireAuth: true });

export const PUT = apiHandler(async (req, { params, body }) => {
  if (body.idPassportNumber && body.idPassportNumber.trim() !== "") {
    const existing = await Guest.findOne({ 
      idPassportNumber: body.idPassportNumber,
      _id: { $ne: params.id } 
    });
    if (existing) {
      return NextResponse.json({ error: "ID/Passport number already exists for another guest" }, { status: 400 });
    }
  }

  const guest = await Guest.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
  if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  return NextResponse.json(guest);
}, { requireAuth: true, schema: guestSchema.partial() });

export const DELETE = apiHandler(async (req, { params }) => {
  const guest = await Guest.findByIdAndDelete(params.id);
  if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  return NextResponse.json({ message: "Guest deleted successfully" });
}, { requireAuth: true, requiredRole: ["super_admin", "admin"] });
