import { z } from "zod";

// --- GUEST VALIDATION ---
export const guestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(5, "Phone number must be at least 5 characters"),
  address: z.string().optional(),
  idPassportNumber: z.string().optional(),
});

// --- ROOM VALIDATION ---
export const roomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  roomType: z.string().min(1, "Room type is required"),
  category: z.string().min(1, "Category is required"),
  floor: z.string().min(1, "Floor is required"),
  capacity: z.number().int().positive("Capacity must be positive"),
  pricePerNight: z.number().positive("Price must be positive"),
  status: z.enum(["Available", "Reserved", "Occupied", "Cleaning", "Maintenance"]).default("Available"),
});

// --- BOOKING VALIDATION ---
export const bookingSchema = z.object({
  guestId: z.string().min(1, "Guest ID is required"),
  roomIds: z.array(z.string()).min(1, "At least one room is required"),
  packageId: z.string().optional(),
  roomPrices: z.array(z.object({
    roomId: z.string(),
    price: z.number()
  })).optional(),
  checkInDate: z.string().or(z.date()).transform(val => new Date(val)),
  checkOutDate: z.string().or(z.date()).transform(val => new Date(val)),
  numberOfGuests: z.number().int().min(1, "At least 1 guest required"),
  totalAmount: z.number().min(0, "Total amount cannot be negative"),
  advancePayment: z.number().min(0).default(0),
  status: z.enum(["Reserved", "Confirmed", "Checked In", "Checked Out", "Cancelled", "No Show"]).default("Reserved"),
  paymentStatus: z.enum(["Pending", "Partially Paid", "Paid", "Refunded"]).optional(),
});

// --- SETTINGS VALIDATION ---
export const businessSettingSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  logo: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  invoiceFooterText: z.string().optional(),
});

export const systemSettingSchema = z.object({
  systemName: z.string().min(1, "System name is required"),
  defaultCurrency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
  taxPercentage: z.number().min(0).max(100),
  serviceChargePercentage: z.number().min(0).max(100),
  allowPosRoomCharges: z.boolean(),
  lateCheckoutPenaltyPerHour: z.number().min(0),
  minAdvancePaymentPercentage: z.number().min(0).max(100),
  enableSms: z.boolean(),
  checkInSmsTemplate: z.string().optional(),
  checkOutSmsTemplate: z.string().optional(),
  receptionistCanViewReports: z.boolean(),
});

// --- INVENTORY VALIDATION ---
export const stockMovementSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  type: z.enum(["in", "out"]),
  quantity: z.number().int().positive("Quantity must be greater than zero"),
  reason: z.enum(["sale", "purchase", "adjustment"]),
});

// --- CHARGE VALIDATION ---
export const chargeSchema = z.object({
  bookingId: z.string().optional(),
  roomId: z.string().optional(),
  chargeType: z.enum(["Room Charge", "Food", "Laundry", "Extra Hours", "Extra Bed", "Discount/Rebate", "Other"]),
  description: z.string().min(1, "Description is required"),
  amount: z.number(), // Allows negative for discounts
  status: z.enum(["Pending", "Added to Bill", "Paid"]).default("Pending"),
});
