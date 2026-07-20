import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Room } from "@/models/Room";
import { User } from "@/models/User";
import { Floor } from "@/models/Floor";
import { RoomType } from "@/models/RoomType";
import { RoomCategory } from "@/models/RoomCategory";
import { RoomPackage } from "@/models/RoomPackage";

export async function GET() {
  try {
    await connectToDatabase();

    await Room.deleteMany({});
    await User.deleteMany({});
    await Floor.deleteMany({});
    await RoomType.deleteMany({});
    await RoomCategory.deleteMany({});
    await RoomPackage.deleteMany({});

    // Seed Masters
    await Floor.create([
      { name: "1st Floor", description: "Standard Floor" },
      { name: "2nd Floor", description: "Deluxe Floor" },
      { name: "3rd Floor", description: "Family/VIP Floor" },
    ]);

    await RoomType.create([
      { name: "Standard", capacity: 2, defaultPrice: 50 },
      { name: "Deluxe", capacity: 2, defaultPrice: 100 },
      { name: "Family", capacity: 4, defaultPrice: 200 },
    ]);

    await RoomCategory.create([
      { name: "AC", description: "Air Conditioned Room" },
      { name: "Non-AC", description: "Regular Ventilation Room" },
    ]);

    await RoomPackage.create([
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

    await User.create([
      { name: "Super Admin", email: "superadmin@aurastay.com", password: "password", role: "super_admin", status: "active" },
      { name: "Admin User", email: "admin@aurastay.com", password: "password", role: "admin", status: "active" },
      { name: "Receptionist", email: "receptionist@aurastay.com", password: "password", role: "receptionist", status: "active" },
    ]);

    const rooms = [];
    // Floor 1
    for (let i = 1; i <= 5; i++) {
      rooms.push({ roomNumber: `10${i}`, roomType: "Standard", category: "Non-AC", floor: "1st Floor", capacity: 2, pricePerNight: 50, status: "Available" });
    }
    // Floor 2
    for (let i = 1; i <= 5; i++) {
      rooms.push({ roomNumber: `20${i}`, roomType: "Deluxe", category: "AC", floor: "2nd Floor", capacity: 2, pricePerNight: 100, status: "Available" });
    }
    // Floor 3
    for (let i = 1; i <= 2; i++) {
      rooms.push({ roomNumber: `30${i}`, roomType: "Family", category: "AC", floor: "3rd Floor", capacity: 4, pricePerNight: 200, status: "Available" });
    }
    
    // Set some statuses
    rooms[0].status = "Occupied";
    rooms[1].status = "Reserved";
    rooms[2].status = "Cleaning";
    rooms[5].status = "Occupied";

    await Room.create(rooms);

    return NextResponse.json({ message: "Database seeded successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
