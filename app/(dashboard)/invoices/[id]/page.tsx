import { notFound } from "next/navigation";
import connectToDatabase from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { Booking } from "@/models/Booking";
import { Guest } from "@/models/Guest";
import { Room } from "@/models/Room";
import { Charge } from "@/models/Charge";
import { Payment } from "@/models/Payment";
import { BusinessSetting } from "@/models/BusinessSetting";
import { MdPrint, MdCheckCircle, MdArrowBack } from "react-icons/md";
import Link from "next/link";

// Using a Client Component for the print button
import ClientPrintButton from "./ClientPrintButton";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  await connectToDatabase();

  const invoiceId = params.id;
  
  // Try to find the invoice
  // If id is not a valid ObjectId, this might throw, so we catch it
  let invoice;
  try {
    invoice = await Invoice.findById(invoiceId).populate({ path: "bookingId", model: Booking }).populate({ path: "guestId", model: Guest }).lean();
    if (!invoice) {
      // Maybe it was searched by bookingId? 
      invoice = await Invoice.findOne({ bookingId: invoiceId }).populate({ path: "bookingId", model: Booking }).populate({ path: "guestId", model: Guest }).lean();
    }
  } catch (e) {
    invoice = await Invoice.findOne({ invoiceNumber: invoiceId }).populate({ path: "bookingId", model: Booking }).populate({ path: "guestId", model: Guest }).lean();
  }

  if (!invoice) {
    return notFound();
  }

  const booking: any = await Booking.findById(invoice.bookingId).populate({ path: "roomIds", model: Room }).lean();
  const guest: any = await Guest.findById(invoice.guestId).lean();
  const business: any = await BusinessSetting.findOne().lean();
  const charges: any[] = await Charge.find({ bookingId: invoice.bookingId }).lean();
  const payments: any[] = await Payment.find({ bookingId: invoice.bookingId }).lean();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isPaid = invoice.balanceDue <= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-0 print:max-w-full">
      {/* Non-printable action bar */}
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm print:hidden">
        <Link href="/checkout" className="flex items-center text-muted-foreground hover:text-foreground font-semibold text-sm transition-colors">
          <MdArrowBack className="mr-2 h-5 w-5" />
          Back to Checkout
        </Link>
        <div className="flex items-center gap-3">
          <ClientPrintButton />
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white text-slate-900 p-8 md:p-12 rounded-2xl border border-border shadow-lg print:border-none print:shadow-none print:p-0 relative overflow-hidden">
        {/* Background Watermark */}
        {isPaid && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
            <span className="text-[150px] font-black rotate-[-30deg] uppercase tracking-widest text-emerald-600">PAID</span>
          </div>
        )}

        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
            <div className="flex flex-col">
              {business?.logo ? (
                <img src={business.logo} alt="Business Logo" className="h-20 object-contain mb-4" />
              ) : (
                <div className="h-16 w-16 bg-slate-900 rounded-xl flex items-center justify-center mb-4 text-white font-black text-2xl">
                  {business?.businessName?.charAt(0) || "H"}
                </div>
              )}
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{business?.businessName || "My Guest House"}</h1>
              <p className="text-slate-500 text-sm mt-1 whitespace-pre-wrap">{business?.address || "123 Hotel Avenue, City"}</p>
              <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-500">
                <span>{business?.phone || "+1 234 567 890"}</span>
                <span>•</span>
                <span>{business?.email || "contact@hotel.com"}</span>
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Invoice</h2>
              <p className="text-sm font-bold text-slate-400">#{invoice.invoiceNumber}</p>
              
              <div className="mt-6 flex flex-col gap-1 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-slate-500 font-medium">Issue Date:</span>
                  <span className="font-bold text-slate-900">{formatDate(invoice.invoiceDate)}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className={`font-bold ${isPaid ? "text-emerald-600" : "text-rose-600"}`}>
                    {isPaid ? "PAID IN FULL" : "PAYMENT DUE"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Guest & Stay Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Billed To</h3>
              <p className="text-lg font-bold text-slate-900">{guest?.firstName} {guest?.lastName}</p>
              <p className="text-slate-500 text-sm mt-1">{guest?.email}</p>
              <p className="text-slate-500 text-sm">{guest?.phone}</p>
              {guest?.address && <p className="text-slate-500 text-sm mt-2">{guest?.address}</p>}
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Stay Details</h3>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <span className="text-slate-500 font-medium">Check-in:</span>
                <span className="font-bold text-slate-900">{booking ? formatDate(booking.checkInDate) : "-"}</span>
                
                <span className="text-slate-500 font-medium">Check-out:</span>
                <span className="font-bold text-slate-900">{booking ? formatDate(booking.checkOutDate) : "-"}</span>
                
                <span className="text-slate-500 font-medium">Rooms:</span>
                <span className="font-bold text-slate-900">
                  {booking?.roomIds?.map((r: any) => r.roomNumber).join(", ")}
                </span>
                
                <span className="text-slate-500 font-medium">Guests:</span>
                <span className="font-bold text-slate-900">{booking?.numberOfGuests}</span>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="py-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Description</th>
                  <th className="py-3 font-bold text-slate-400 uppercase tracking-wider text-xs w-1/4">Type</th>
                  <th className="py-3 font-bold text-slate-400 uppercase tracking-wider text-xs text-right w-1/4">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {invoice.totalAmount - charges.reduce((sum: number, c: any) => sum + c.amount, 0) > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-4 font-semibold text-slate-900">Base Room Rate (Stay Duration)</td>
                    <td className="py-4 text-slate-500 font-medium">Room Charge</td>
                    <td className="py-4 font-bold text-slate-900 text-right">
                      ${(invoice.totalAmount - charges.reduce((sum: number, c: any) => sum + c.amount, 0)).toFixed(2)}
                    </td>
                  </tr>
                )}
                {charges.map((charge: any) => (
                  <tr key={charge._id.toString()} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 font-semibold text-slate-900">{charge.description}</td>
                    <td className="py-4 text-slate-500 font-medium">{charge.chargeType}</td>
                    <td className="py-4 font-bold text-slate-900 text-right">${charge.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end border-t-2 border-slate-100 pt-6">
            <div className="w-1/2 min-w-[300px]">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold text-slate-900">${invoice.totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-dashed border-slate-200 my-2 pt-2 pb-2">
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Payments Made</span>
                </div>
                {booking?.advancePayment > 0 && (
                  <div className="flex justify-between py-1 text-sm text-emerald-600">
                    <span>Advance Deposit</span>
                    <span className="font-bold">-${booking.advancePayment.toFixed(2)}</span>
                  </div>
                )}
                {payments.map((p: any) => (
                  <div key={p._id.toString()} className="flex justify-between py-1 text-sm text-emerald-600">
                    <span>Payment ({p.paymentMethod})</span>
                    <span className="font-bold">-${p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between py-4 border-t-4 border-slate-900 mt-2 items-center">
                <span className="text-lg font-black text-slate-900 uppercase">Balance Due</span>
                <span className={`text-2xl font-black ${isPaid ? "text-emerald-600" : "text-rose-600"}`}>
                  ${Math.max(0, invoice.balanceDue).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer message */}
          <div className="mt-16 pt-8 border-t-2 border-slate-100 text-center text-slate-400 text-xs font-medium">
            <p className="mb-1 font-bold text-slate-500 uppercase tracking-widest">Thank you for staying with us!</p>
            <p>If you have any questions regarding this invoice, please contact {business?.email || "our support team"}.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
