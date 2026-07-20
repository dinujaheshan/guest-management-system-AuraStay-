import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Guest } from "@/models/Guest";

export async function GET() {
  try {
    await connectToDatabase();

    await Guest.deleteMany({});

    await Guest.create([
      {
        firstName: "Kamal",
        lastName: "Perera",
        idPassportNumber: "951234567V",
        phone: "0771234567",
        email: "kamal.p@example.com",
        address: "No 12, Main Street, Colombo",
        visitCount: 2
      },
      {
        firstName: "Nimal",
        lastName: "Bandara",
        idPassportNumber: "881234567V",
        phone: "0719876543",
        email: "nimal.b@example.com",
        address: "Kandy Road, Peradeniya",
        visitCount: 1
      },
      {
        firstName: "Sunil",
        lastName: "Shantha",
        idPassportNumber: "N78945612",
        phone: "0701122334",
        email: "sunil.s@example.com",
        address: "Galle Road, Matara",
        visitCount: 5
      },
      {
        firstName: "Amali",
        lastName: "Silva",
        idPassportNumber: "991234567V",
        phone: "0765544332",
        email: "amali.silva@example.com",
        address: "Negombo Road, Kurunegala",
        visitCount: 0
      }
    ]);

    return NextResponse.json({ message: "Guests seeded successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
