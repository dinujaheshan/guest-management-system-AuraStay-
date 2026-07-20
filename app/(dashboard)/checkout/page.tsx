"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdLogout, MdRefresh, MdReceipt, MdAttachMoney, MdLocalMall, MdAdd } from "react-icons/md";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const router = useRouter();
  const [activeStays, setActiveStays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStay, setSelectedStay] = useState<any | null>(null);

  // Folio details
  const [charges, setCharges] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingFolio, setLoadingFolio] = useState(false);

  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payNotes, setPayNotes] = useState("");

  // Custom Charge
  const [chargeDesc, setChargeDesc] = useState("");
  const [chargeAmount, setChargeAmount] = useState<number | "">("");
  const [chargeType, setChargeType] = useState("Other");

  const fetchActiveStays = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      const filtered = Array.isArray(data) 
        ? data.filter((b: any) => b.status === "Checked In")
        : [];
      setActiveStays(filtered);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchFolioDetails = async (booking: any) => {
    if (!booking) return;
    setLoadingFolio(true);
    try {
      const [chargesRes, paymentsRes, bookingRes] = await Promise.all([
        fetch(`/api/charges?bookingId=${booking._id}`),
        fetch(`/api/payments?bookingId=${booking._id}`),
        fetch(`/api/bookings/${booking._id}`),
      ]);
      const chargesData = await chargesRes.json();
      const paymentsData = await paymentsRes.json();
      const bookingData = await bookingRes.json();
      
      setCharges(Array.isArray(chargesData) ? chargesData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      if (!bookingData.error) {
        setSelectedStay(bookingData);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingFolio(false);
  };

  useEffect(() => {
    fetchActiveStays();
  }, []);

  const selectStay = (booking: any) => {
    setSelectedStay(booking);
    fetchFolioDetails(booking);
    // Reset payment fields
    setPayAmount(0);
    setPayNotes("");
  };

  const totalCharges = selectedStay?.totalAmount || 0;

  const totalPayments = (selectedStay?.advancePayment || 0) + payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = totalCharges - totalPayments;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStay || payAmount <= 0) return alert("Please enter a valid amount");

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedStay._id,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          notes: payNotes || "Folio settlement payment",
        }),
      });

      if (res.ok) {
        alert("Payment recorded successfully!");
        setPayAmount(0);
        setPayNotes("");
        fetchFolioDetails(selectedStay);
        // Refresh stays list to keep totals in sync
        fetchActiveStays();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to record payment");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCustomCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStay || !chargeDesc || !chargeAmount) return alert("Please fill all charge details");

    try {
      const res = await fetch("/api/charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedStay._id,
          chargeType,
          description: chargeDesc,
          amount: Number(chargeAmount),
        }),
      });

      if (res.ok) {
        alert("Charge added to folio successfully!");
        setChargeDesc("");
        setChargeAmount("");
        fetchFolioDetails(selectedStay);
        fetchActiveStays();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add charge");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckout = async () => {
    if (!selectedStay) return;

    if (balanceDue > 0.01) {
      return alert(`Cannot complete checkout. There is an outstanding balance of $${balanceDue.toFixed(2)}. Please settle the full balance first.`);
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: selectedStay._id }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to invoice page instead of just an alert
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
          <h2 className="text-3xl font-bold tracking-tight">Check-Out Desk</h2>
          <p className="text-muted-foreground mt-1 text-sm">Settle folios, process payments, and finalize guest departures.</p>
        </div>
        <Button variant="outline" onClick={fetchActiveStays} disabled={loading} className="rounded-xl">
          <MdRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Stays List */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Currently Checked-In Stays</h3>
            </div>
            {loading ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">Loading stays...</div>
            ) : activeStays.length === 0 ? (
              <div className="flex h-[250px] flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <MdLogout className="h-10 w-10 opacity-20 mb-2" />
                <p>No active stay logs found.</p>
                <p className="text-xs text-muted-foreground mt-1">Stays only appear when bookings are Checked In.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeStays.map((stay) => (
                  <div 
                    key={stay._id} 
                    onClick={() => selectStay(stay)}
                    className={`p-4 cursor-pointer hover:bg-muted/20 transition-colors ${
                      selectedStay?._id === stay._id ? "bg-primary/5 border-l-4 border-primary" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-foreground">
                          {stay.guestId?.firstName} {stay.guestId?.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Rooms: <span className="font-semibold text-primary">{stay.roomIds?.map((r: any) => r.roomNumber).join(", ")}</span>
                        </div>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold">
                        Stay Active
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                      <div>
                        Departing: {new Date(stay.checkOutDate).toLocaleDateString()}
                      </div>
                      <div className="font-bold text-foreground">
                        Total Amount: ${stay.totalAmount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Folio Billing Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStay ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Folio Items */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <MdReceipt className="text-primary h-5 w-5" />
                    Guest Folio Ledger
                  </h3>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    Open Stay
                  </span>
                </div>

                {loadingFolio ? (
                  <div className="text-sm text-muted-foreground text-center py-10">Loading folio items...</div>
                ) : (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {/* Stay Charges list */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Folio Charges</div>
                      {charges.map((charge) => (
                        <div key={charge._id} className="flex justify-between items-start text-xs border-b border-muted pb-2">
                          <div>
                            <div className="font-semibold text-foreground">{charge.description}</div>
                            <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{charge.chargeType}</div>
                          </div>
                          <span className="font-bold text-foreground">${charge.amount}</span>
                        </div>
                      ))}
                    </div>

                    {/* Payments list */}
                    <div className="space-y-2 pt-2 border-t border-dashed border-border">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payments Logged</div>
                      {/* Advance payment */}
                      <div className="flex justify-between text-xs text-emerald-600">
                        <span>Advance Deposit (At Booking)</span>
                        <span>-${selectedStay.advancePayment}</span>
                      </div>
                      {payments.map((p) => (
                        <div key={p._id} className="flex justify-between text-xs text-emerald-600">
                          <span>Payment via {p.paymentMethod} {p.notes ? `(${p.notes})` : ""}</span>
                          <span>-${p.amount}</span>
                        </div>
                      ))}
                    </div>

                    {/* Overall Summary */}
                    <div className="pt-3 border-t border-border space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal Charges:</span>
                        <span className="font-semibold">${totalCharges}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>Total Paid Deposits:</span>
                        <span className="font-semibold">-${totalPayments}</span>
                      </div>
                      <div className="flex justify-between text-lg font-black border-t border-border pt-2">
                        <span>Net Balance Due:</span>
                        <span className={balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}>
                          ${balanceDue}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  {balanceDue > 0.01 && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-3 text-center font-bold">
                      ⚠️ Full balance must be settled before check-out and invoice generation.
                    </div>
                  )}
                  <Button 
                    onClick={handleCheckout} 
                    disabled={balanceDue > 0.01}
                    className={`w-full rounded-xl shadow-lg h-12 text-base font-bold transition-all ${
                      balanceDue > 0.01 
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300" 
                        : "bg-primary hover:bg-primary/95"
                    }`}
                  >
                    <MdLogout className="mr-2 h-5 w-5" />
                    Generate Invoice & Check-Out
                  </Button>
                </div>
              </div>

              {/* Payments & Charges panel */}
              <div className="space-y-6">
                {/* Record Payment */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <MdAttachMoney className="text-emerald-600 h-5 w-5" />
                      Record Payment
                    </h3>
                    {balanceDue > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setPayAmount(balanceDue)}
                        className="h-8 text-xs font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        Settle Full Balance
                      </Button>
                    )}
                  </div>

                  <form onSubmit={handleRecordPayment} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Payment Amount ($)</label>
                    <input 
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={payAmount}
                      onChange={e => setPayAmount(Number(e.target.value))}
                      className="w-full p-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary"
                      placeholder="e.g. 150.00"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Payment Method</label>
                    <select 
                      value={payMethod} 
                      onChange={e => setPayMethod(e.target.value)} 
                      className="w-full p-2.5 bg-background border border-input rounded-xl"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Mobile Wallet">Mobile Wallet</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Transaction Notes</label>
                    <input 
                      value={payNotes}
                      onChange={e => setPayNotes(e.target.value)}
                      className="w-full p-2.5 bg-background border border-input rounded-xl"
                      placeholder="e.g. Card settlement receipt #432"
                    />
                  </div>

                  <Button type="submit" variant="outline" className="w-full h-11 rounded-xl font-bold shadow-sm">
                    Record Receipt
                  </Button>
                </form>

                <div className="bg-muted/30 border border-border p-4 rounded-xl text-xs space-y-2 text-muted-foreground mt-4">
                  <p className="font-bold text-foreground/80 flex items-center gap-1">
                    <MdLocalMall className="h-4 w-4 text-primary" />
                    Folio Rules:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Payments are logged instantly in the transactions ledger.</li>
                    <li>Checkout releases the rooms back to 'Cleaning' status.</li>
                    <li>Finalized invoices are locked and saved under Invoice Management.</li>
                  </ul>
                </div>
              </div>

                {/* Add Custom Charge */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4 mt-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-border pb-3">
                    <MdAdd className="text-rose-500 h-5 w-5" />
                    Add Custom Charge
                  </h3>

                  <form onSubmit={handleAddCustomCharge} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Charge Type</label>
                      <select 
                        value={chargeType} 
                        onChange={e => setChargeType(e.target.value)} 
                        className="w-full p-2 bg-background border border-input rounded-xl text-sm"
                      >
                        <option value="Other">Other</option>
                        <option value="Laundry">Laundry</option>
                        <option value="Extra Hours">Extra Hours</option>
                        <option value="Extra Bed">Extra Bed</option>
                        <option value="Room Charge">Room Charge</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <input 
                        required
                        value={chargeDesc}
                        onChange={e => setChargeDesc(e.target.value)}
                        className="w-full p-2 bg-background border border-input rounded-xl text-sm"
                        placeholder="e.g. Late checkout penalty"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Amount ($)</label>
                      <input 
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={chargeAmount}
                        onChange={e => setChargeAmount(Number(e.target.value))}
                        className="w-full p-2 bg-background border border-input rounded-xl text-sm"
                        placeholder="e.g. 50.00"
                      />
                    </div>

                    <Button type="submit" variant="secondary" className="w-full h-11 rounded-xl font-bold shadow-sm">
                      Add to Folio
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col items-center justify-center h-[350px] text-muted-foreground text-center">
              <MdReceipt className="h-12 w-12 opacity-20 mb-2" />
              <h3 className="font-semibold text-base text-foreground/80">No Stay Selected</h3>
              <p className="text-sm max-w-sm mt-1">Select an active room stay from the left menu to view the bill invoice and record checkout transactions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
