import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { stockMovementSchema } from "@/lib/validations";
import { StockMovement } from "@/models/StockMovement";
import { MenuItem } from "@/models/MenuItem";

export const GET = apiHandler(async () => {
  // Fetch all items that track stock (Products and Beverages typically)
  // We can fetch everything for now and let frontend filter, or filter here.
  // Fetching all items that aren't strictly "Service"
  const items = await MenuItem.find({ category: { $ne: "Service" } }).sort({ itemName: 1 });
  
  // Optionally fetch latest 50 movements
  const movements = await StockMovement.find()
    .sort({ date: -1 })
    .limit(50)
    .populate("productId", "itemName");

  return NextResponse.json({ items, movements });
}, { requireAuth: true });

export const POST = apiHandler(async (req, { body }) => {
  const { productId, type, quantity, reason } = body;

  const item = await MenuItem.findById(productId);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // Calculate new quantity
  let newQuantity = item.stockQuantity;
  if (type === "in") {
    newQuantity += quantity;
  } else if (type === "out") {
    newQuantity -= quantity;
    if (newQuantity < 0) newQuantity = 0; // Prevent negative stock
  }

  // Create Movement Log
  const movement = await StockMovement.create({
    productId,
    type,
    quantity,
    reason,
    date: new Date()
  });

  // Update Item
  item.stockQuantity = newQuantity;
  await item.save();

  return NextResponse.json({ message: "Stock updated successfully", movement, newQuantity }, { status: 201 });
}, { requireAuth: true, schema: stockMovementSchema });
