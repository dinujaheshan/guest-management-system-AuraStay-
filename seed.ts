import mongoose from "mongoose";
import * as dotenv from "dotenv";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in environments where setServers is restricted
}

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Schemas
const RoomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true },
    roomType: { type: String, required: true },
    category: { type: String, required: true },
    floor: { type: String, required: true },
    capacity: { type: Number, required: true },
    pricePerNight: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["Available", "Reserved", "Occupied", "Cleaning", "Maintenance"], 
      default: "Available" 
    },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["super_admin", "admin", "receptionist"], default: "receptionist" },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
  },
  { timestamps: true }
);

const FloorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

const RoomTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true, default: 2 },
    defaultPrice: { type: Number, required: true, default: 100 },
  },
  { timestamps: true }
);

const RoomCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

const RoomPackageSchema = new mongoose.Schema(
  {
    packageName: { type: String, required: true },
    description: { type: String },
    roomType: { type: String, required: true },
    category: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    includedServices: [{ type: String }],
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

// Models
const Room = mongoose.models.Room || mongoose.model("Room", RoomSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Floor = mongoose.models.Floor || mongoose.model("Floor", FloorSchema);
const RoomType = mongoose.models.RoomType || mongoose.model("RoomType", RoomTypeSchema);
const RoomCategory = mongoose.models.RoomCategory || mongoose.model("RoomCategory", RoomCategorySchema);
const RoomPackage = mongoose.models.RoomPackage || mongoose.model("RoomPackage", RoomPackageSchema);

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB.");

    console.log("Clearing existing data...");
    await Room.deleteMany({});
    await User.deleteMany({});
    await Floor.deleteMany({});
    await RoomType.deleteMany({});
    await RoomCategory.deleteMany({});
    await RoomPackage.deleteMany({});

    console.log("Seeding Floors...");
    await Floor.create([
      { name: "1st Floor", description: "Standard Floor" },
      { name: "2nd Floor", description: "Deluxe Floor" },
      { name: "3rd Floor", description: "Family/VIP Floor" },
    ]);

    console.log("Seeding Room Types...");
    await RoomType.create([
      { name: "Standard", capacity: 2, defaultPrice: 50 },
      { name: "Deluxe", capacity: 2, defaultPrice: 100 },
      { name: "Family", capacity: 4, defaultPrice: 200 },
    ]);

    console.log("Seeding Room Categories...");
    await RoomCategory.create([
      { name: "AC", description: "Air Conditioned Room" },
      { name: "Non-AC", description: "Regular Ventilation Room" },
    ]);

    console.log("Seeding Room Packages...");
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

    console.log("Seeding Users...");
    await User.create([
      { name: "Super Admin", email: "superadmin@aurastay.com", password: "password", role: "super_admin", status: "active" },
      { name: "Admin User", email: "admin@aurastay.com", password: "password", role: "admin", status: "active" },
      { name: "Receptionist", email: "receptionist@aurastay.com", password: "password", role: "receptionist", status: "active" },
    ]);

    console.log("Seeding Rooms...");
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
    
    // Set some initial statuses
    rooms[0].status = "Occupied";
    rooms[1].status = "Reserved";
    rooms[2].status = "Cleaning";
    rooms[5].status = "Occupied";

    await Room.create(rooms);
    console.log("Successfully seeded database with all master and demo entries.");

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seed();
