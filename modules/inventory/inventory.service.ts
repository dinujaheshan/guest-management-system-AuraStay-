import { MenuItem } from "@/models/MenuItem";
import { Charge } from "@/models/Charge";
import { Booking } from "@/models/Booking";
import { FoodOrderItem } from "@/models/FoodOrderItem";
import { StockMovement } from "@/models/StockMovement";
import { Payment } from "@/models/Payment";
import connectToDatabase from "@/lib/db";

export class InventoryService {
  static async getAllMenuItems() {
    await connectToDatabase();
    return await MenuItem.find({}).sort({ itemName: 1 });
  }

  static async createMenuItem(body: any) {
    await connectToDatabase();
    return await MenuItem.create(body);
  }

  static async placeFoodOrder(bookingId: string, menuItemId: string, quantity: number, roomId?: string, payNow?: boolean, paymentMethod?: string) {
    await connectToDatabase();
    
    if (!bookingId || !menuItemId || !quantity || quantity <= 0) {
      throw new Error("Missing or invalid parameters");
    }

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    if (menuItem.isInventoryTracked !== false && menuItem.stockQuantity < quantity) {
      throw new Error(`Insufficient stock. Only ${menuItem.stockQuantity} remaining.`);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (menuItem.isInventoryTracked !== false) {
      // 1. Deduct Stock
      menuItem.stockQuantity -= quantity;
      await menuItem.save();

      // 2. Log Stock Movement
      await StockMovement.create({
        productId: menuItem._id,
        type: "out",
        quantity,
        reason: "sale"
      });
    }

    // 3. Create FoodOrderItem (for Kitchen KOT)
    const foodChargeAmount = menuItem.price * quantity;
    await FoodOrderItem.create({
      bookingId: booking._id,
      roomId,
      menuItemId: menuItem._id,
      itemName: menuItem.itemName,
      quantity,
      unitPrice: menuItem.price,
      totalPrice: foodChargeAmount,
      status: "pending"
    });

    // 4. Create Charge
    const charge = await Charge.create({
      bookingId: booking._id,
      chargeType: "Food",
      description: `POS Order - ${menuItem.itemName} (Qty: ${quantity} @ $${menuItem.price}/each)`,
      amount: foodChargeAmount,
      status: payNow ? "Paid" : "Pending",
    });

    if (payNow) {
      await Payment.create({
        bookingId: booking._id,
        amount: foodChargeAmount,
        paymentMethod: paymentMethod || "Cash",
        notes: "POS Instant Payment",
      });
    }

    // 5. Update Booking total amount
    booking.totalAmount = (booking.totalAmount || 0) + foodChargeAmount;
    await booking.save();

    return {
      message: "Food order placed successfully",
      charge,
      remainingStock: menuItem.stockQuantity,
    };
  }
}
