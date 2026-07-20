"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdPayment, MdReceipt, MdRefresh, MdClose } from "react-icons/md";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      // Filter for active bookings that need payment
      const active = Array.isArray(data) ? data.filter((b: any) => 
        ["Reserved", "Confirmed", "Checked In"].includes(b.status) || 
        (b.status === "Checked Out" && b.paymentStatus !== "Paid")
      ) : [];
      setBookings(active);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking._id,
          amount: Number(paymentAmount),
          paymentMethod,
          notes: paymentNotes
        }),
      });

      if (res.ok) {
        alert("Payment recorded successfully!");
        setSelectedBooking(null);
        fetchBookings();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to record payment");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckoutInvoice = async (booking: any) => {
    if (!confirm("Are you sure you want to finalize this folio and generate an invoice?")) return;
    try {
      const res = await fetch(`/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking._id }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/invoices/${data.invoice._id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Checkout failed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing & Folios</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage guest payments and active folios.</p>
        </div>
        <Button variant="outline" onClick={fetchBookings} className="rounded-xl">
          <MdRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">Loading folios...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Guest & Room</th>
                  <th className="px-6 py-4 font-semibold">Total Amount</th>
                  <th className="px-6 py-4 font-semibold">Paid Amount</th>
                  <th className="px-6 py-4 font-semibold">Balance Due</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const balance = Math.max(0, booking.totalAmount - (booking.advancePayment || 0));
                  return (
                    <tr key={booking._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold">{booking.guestId?.firstName} {booking.guestId?.lastName}</div>
                        <div className="text-xs text-muted-foreground">Rooms: {booking.roomIds?.map((r: any) => r.roomNumber).join(", ")}</div>
                      </td>
                      <td className="px-6 py-4 font-bold">${booking.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">${(booking.advancePayment || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`font-black ${balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          ${balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">{booking.paymentStatus}</span>
                        <div className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">{booking.status}</div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedBooking(booking);
                            setPaymentAmount(balance);
                          }}
                          disabled={balance <= 0}
                          className="mr-2 rounded-lg text-xs font-bold border-primary/20 text-primary hover:bg-primary hover:text-white"
                        >
                          <MdPayment className="mr-1 h-4 w-4" /> Add Payment
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCheckoutInvoice(booking)}
                          disabled={booking.status === "Checked Out"}
                          className="rounded-lg text-xs"
                        >
                          <MdReceipt className="mr-1 h-4 w-4" /> Checkout & Invoice
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No active folios found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MdPayment className="text-primary h-5 w-5" /> Record Payment
              </h3>
              <button onClick={() => setSelectedBooking(null)} className="p-1 hover:bg-muted rounded-lg text-muted-foreground">
                <MdClose className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="bg-muted/30 p-3 rounded-lg border border-border flex justify-between text-sm">
                <span className="font-semibold text-muted-foreground">Guest:</span>
                <span className="font-bold">{selectedBooking.guestId?.firstName} {selectedBooking.guestId?.lastName}</span>
              </div>
              <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 flex justify-between text-sm">
                <span className="font-semibold text-rose-600">Balance Due:</span>
                <span className="font-black text-rose-600">${Math.max(0, selectedBooking.totalAmount - (selectedBooking.advancePayment || 0)).toFixed(2)}</span>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Payment Amount ($)</label>
                <input 
                  type="number" 
                  required 
                  min="0.01" 
                  step="0.01"
                  max={Math.max(0, selectedBooking.totalAmount - (selectedBooking.advancePayment || 0))}
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(Number(e.target.value))} 
                  className="w-full p-2.5 border border-input bg-background rounded-xl text-lg font-bold" 
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)} 
                  className="w-full p-2.5 border border-input bg-background rounded-xl"
                >
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                  <option>Mobile Wallet</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Reference / Notes (Optional)</label>
                <input 
                  type="text" 
                  value={paymentNotes} 
                  onChange={e => setPaymentNotes(e.target.value)} 
                  placeholder="e.g. Ref #12345"
                  className="w-full p-2.5 border border-input bg-background rounded-xl" 
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full rounded-xl h-12 font-bold text-base shadow-md">
                  Confirm Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
