import { Invoice } from "@/models/Invoice";
import connectToDatabase from "@/lib/db";

export class InvoiceService {
  static async generateInvoice(bookingId: string, totalAmount: number, paidAmount: number) {
    await connectToDatabase();
    const balance = Math.max(0, totalAmount - paidAmount);
    const invoiceNumber = `INV-${Date.now()}`;
    
    return await Invoice.create({
      invoiceNumber,
      bookingId,
      totalAmount,
      paidAmount,
      balance,
      generatedAt: new Date()
    });
  }
}
