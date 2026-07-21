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

  static async placeFoodOrder(bookingId: string | null, menuItemId: string, quantity: number, roomId?: string, payNow?: boolean, paymentMethod?: string) {
    await connectToDatabase();
    
    if (!menuItemId || !quantity || quantity <= 0) {
      throw new Error("Missing or invalid parameters");
    }

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    if (menuItem.isInventoryTracked !== false && menuItem.stockQuantity < quantity) {
      throw new Error(`Insufficient stock. Only ${menuItem.stockQuantity} remaining.`);
    }

    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }
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

    const foodChargeAmount = menuItem.price * quantity;

    // 3. Create FoodOrderItem (for Kitchen KOT)
    const foodOrderItemData: any = {
      menuItemId: menuItem._id,
      itemName: menuItem.itemName,
      quantity,
      unitPrice: menuItem.price,
      totalPrice: foodChargeAmount,
      status: "pending"
    };
    if (booking) foodOrderItemData.bookingId = booking._id;
    if (roomId) foodOrderItemData.roomId = roomId;
    
    await FoodOrderItem.create(foodOrderItemData);

    let charge = null;
    // 4. Create Charge if there is a booking
    if (booking) {
      charge = await Charge.create({
        bookingId: booking._id,
        chargeType: "Food",
        description: `POS Order - ${menuItem.itemName} (Qty: ${quantity} @ $${menuItem.price}/each)`,
        amount: foodChargeAmount,
        status: payNow ? "Paid" : "Pending",
      });
    }

    let payment = null;
    if (payNow) {
      const paymentData: any = {
        amount: foodChargeAmount,
        paymentMethod: paymentMethod || "Cash",
        notes: booking ? "POS Instant Payment" : "Walk-in POS Order",
      };
      if (booking) paymentData.bookingId = booking._id;
      
      payment = await Payment.create(paymentData);
    }

    // 5. Update Booking total amount if there is a booking
    if (booking) {
      booking.totalAmount = (booking.totalAmount || 0) + foodChargeAmount;
      await booking.save();
    }

    return {
      message: booking ? "Food order placed successfully" : "Walk-in food order placed successfully",
      charge,
      remainingStock: menuItem.stockQuantity,
      receipt: {
        orderType: booking ? "Room Order" : "Walk-in Order",
        date: new Date(),
        items: [{
          itemName: menuItem.itemName,
          quantity: quantity,
          unitPrice: menuItem.price,
          totalPrice: foodChargeAmount
        }],
        totalAmount: foodChargeAmount,
        paymentStatus: payNow ? "Paid" : "Added to Room Bill",
        paymentMethod: payNow ? (paymentMethod || "Cash") : "N/A",
        roomDetails: booking ? `Room ${roomId || ""}` : undefined
      }
    };
  }
}
