"use client";

import { useState, useEffect } from "react";
import { MdAttachMoney, MdAdd, MdRefresh, MdDelete } from "react-icons/md";
import { Button } from "@/components/ui/button";

const initialFormData = {
  bookingId: "",
  chargeType: "Laundry",
  description: "",
  amount: 10,
};

export default function ChargesPage() {
  const [charges, setCharges] = useState<any[]>([]);
  const [activeStays, setActiveStays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [filterBookingId, setFilterBookingId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = filterBookingId ? `/api/charges?bookingId=${filterBookingId}` : "/api/charges";
      const [chargesRes, staysRes] = await Promise.all([
        fetch(url),
        fetch("/api/bookings"),
      ]);
      const chargesData = await chargesRes.json();
      const staysData = await staysRes.json();
      
      setCharges(Array.isArray(chargesData) ? chargesData : []);
      // OnlyChecked In stays can receive new charges
      setActiveStays(Array.isArray(staysData) ? staysData.filter((s: any) => s.status === "Checked In") : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filterBookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bookingId) return alert("Please select an active guest room stay");
    if (!formData.description) return alert("Please enter description");
    if (formData.amount <= 0) return alert("Amount must be greater than 0");

    try {
      const finalAmount = formData.chargeType === "Discount/Rebate" 
        ? -Math.abs(Number(formData.amount)) 
        : Math.abs(Number(formData.amount));

      const res = await fetch("/api/charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: finalAmount,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData(initialFormData);
        fetchData();
      } else {
        alert("Failed to add charge to folio");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this charge from the guest folio?")) return;
    try {
      const res = await fetch(`/api/charges/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete charge");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Additional Charges</h2>
          <p className="text-muted-foreground mt-1 text-sm">Post extra services (laundry, transport, beds) onto active guest stays.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading} className="rounded-xl">
            <MdRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => showForm ? setShowForm(false) : setShowForm(true)} className="rounded-xl shadow-md">
            {showForm ? "Cancel" : <><MdAdd className="mr-2 h-5 w-5" /> Add Charge</>}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">Post New Charge to Stay Folio</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Active Guest Room Stay *</label>
              <select 
                required 
                value={formData.bookingId} 
                onChange={e => setFormData({...formData, bookingId: e.target.value})} 
                className="w-full p-2 bg-background border border-input rounded-md"
              >
                <option value="">-- Select Stay --</option>
                {activeStays.map((stay) => (
                  <option key={stay._id} value={stay._id}>
                    Room {stay.roomIds?.map((r: any) => r.roomNumber).join(", ")} - {stay.guestId?.firstName} {stay.guestId?.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Charge Type</label>
              <select value={formData.chargeType} onChange={e => setFormData({...formData, chargeType: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md">
                <option>Laundry</option>
                <option>Extra Hours</option>
                <option>Extra Bed</option>
                <option>Transport</option>
                <option>Discount/Rebate</option>
                <option>Equipment</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description *</label>
              <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="e.g. 2 Bags of Laundry" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Amount ($) *</label>
              <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" />
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <Button type="submit" className="px-6 rounded-xl shadow-md h-10">
                Post Charge
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List section */}
      <div className="space-y-4">
        {/* Filter panel */}
        <div className="bg-card rounded-2xl border border-border p-4 flex gap-4 items-center">
          <span className="text-sm font-semibold text-muted-foreground uppercase">Filter by Room Stay:</span>
          <select 
            value={filterBookingId} 
            onChange={e => setFilterBookingId(e.target.value)} 
            className="p-1.5 bg-background border border-input rounded-md text-sm"
          >
            <option value="">-- All Stays --</option>
            {activeStays.map((stay) => (
              <option key={stay._id} value={stay._id}>
                Room {stay.roomIds?.map((r: any) => r.roomNumber).join(", ")} - {stay.guestId?.firstName} {stay.guestId?.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Charges Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">Loading charges...</div>
          ) : charges.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
              <MdAttachMoney className="h-10 w-10 opacity-20 mb-2" />
              <p>No additional charges logged.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Stay Booking ID</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Date Logged</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{charge.bookingId}</td>
                    <td className="px-6 py-4">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold">{charge.chargeType}</span>
                    </td>
                    <td className="px-6 py-4">{charge.description}</td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      {charge.amount < 0 ? (
                        <span className="text-rose-500">-${Math.abs(charge.amount)}</span>
                      ) : (
                        `$${charge.amount}`
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(charge.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      {charge.chargeType !== "Room Charge" && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(charge._id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <MdDelete className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
