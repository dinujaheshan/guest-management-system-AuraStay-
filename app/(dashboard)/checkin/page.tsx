"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdLogin, MdRefresh, MdPeople, MdMeetingRoom, MdAdd } from "react-icons/md";
import { Button } from "@/components/ui/button";

export default function CheckinPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  
  // Guest details state
  const [missingId, setMissingId] = useState("");
  const [missingEmail, setMissingEmail] = useState("");
  
  // Room assignment state
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [roomRates, setRoomRates] = useState<{ [roomId: string]: number }>({});
  const [packageId, setPackageId] = useState("");
  
  // Billing state
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const fetchMetadata = async () => {
    try {
      const [roomsRes, pkgsRes] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/room-packages")
      ]);
      setRooms(await roomsRes.json());
      setPackages(await pkgsRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      // Filter for Reserved or Confirmed bookings only
      const filtered = Array.isArray(data) 
        ? data.filter((b: any) => ["Reserved", "Confirmed"].includes(b.status))
        : [];
      setBookings(filtered);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetadata();
    fetchReservations();
  }, []);

  const selectBooking = (booking: any) => {
    setSelectedBooking(booking);
    
    // Set missing guest info
    setMissingId(booking.guestId?.idPassportNumber || "");
    setMissingEmail(booking.guestId?.email || "");

    // Set rooms and rates
    const assignedIds = booking.roomIds?.map((r: any) => r._id) || [];
    setSelectedRoomIds(assignedIds);
    setPackageId(booking.packageId?._id || "");
    
    const rates: { [id: string]: number } = {};
    booking.roomPrices?.forEach((rp: any) => { rates[rp.roomId] = rp.price; });
    setRoomRates(rates);

    // Set billing
    setCalculatedTotal(booking.totalAmount);
    const pending = booking.totalAmount - (booking.advancePayment || 0);
    setPendingAmount(pending);
    setPaymentAmount(pending > 0 ? pending : 0);
  };

  // Recalculate totals when rooms change
  useEffect(() => {
    if (!selectedBooking) return;
    
    const start = new Date(selectedBooking.checkInDate);
    const end = new Date(selectedBooking.checkOutDate);
    let nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    if (nights <= 0) nights = 1;
    
    const sumRates = Object.values(roomRates).reduce((sum, r) => sum + r, 0);
    const newTotal = sumRates * nights;
    
    setCalculatedTotal(newTotal);
    const newPending = newTotal - (selectedBooking.advancePayment || 0);
    setPendingAmount(newPending);
  }, [selectedRoomIds, roomRates, selectedBooking]);

  const handleRoomSelection = (roomId: string, defaultPrice: number) => {
    let newSelected: string[];
    const newRates = { ...roomRates };

    if (selectedRoomIds.includes(roomId)) {
      newSelected = selectedRoomIds.filter(id => id !== roomId);
      delete newRates[roomId];
    } else {
      newSelected = [...selectedRoomIds, roomId];
      newRates[roomId] = defaultPrice;
    }
    
    setSelectedRoomIds(newSelected);
    setRoomRates(newRates);
  };

  const handlePackageChange = (pkgId: string) => {
    setPackageId(pkgId);
    if (!pkgId) return;
    
    const selectedPkg = packages.find(p => p._id === pkgId);
    if (selectedPkg) {
      const matchingRooms = rooms.filter(
        r => r.roomType === selectedPkg.roomType && 
             r.category === selectedPkg.category && 
             (r.status === "Available" || selectedRoomIds.includes(r._id))
      );
      if (matchingRooms.length > 0) {
        const firstRoom = matchingRooms[0];
        setSelectedRoomIds([firstRoom._id]);
        setRoomRates({ [firstRoom._id]: selectedPkg.pricePerNight });
      } else {
        alert("No available rooms found for this package type");
      }
    }
  };

  const handleCheckIn = async () => {
    if (!selectedBooking) return;
    
    // Check mandatory fields
    if (!missingId || missingId.trim() === "") {
      return alert("ID/Passport Number is required for Check-In.");
    }
    
    if (selectedRoomIds.length === 0) {
      return alert("Please assign at least one room to the guest.");
    }

    try {
      // 1. Update guest if fields were missing or changed
      if (
        missingId !== selectedBooking.guestId?.idPassportNumber || 
        missingEmail !== selectedBooking.guestId?.email
      ) {
        const updateRes = await fetch(`/api/guests/${selectedBooking.guestId._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idPassportNumber: missingId,
            email: missingEmail,
          }),
        });

        if (!updateRes.ok) throw new Error("Failed to update guest details");
      }

      // 2. Update Booking with new rooms and total
      const bookingRes = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomIds: selectedRoomIds,
          packageId: packageId || undefined,
          roomPrices: Object.entries(roomRates).map(([roomId, price]) => ({ roomId, price })),
          totalAmount: calculatedTotal,
        })
      });
      if (!bookingRes.ok) throw new Error("Failed to assign rooms to booking");
      
      // 3. Record Payment if provided
      if (paymentAmount > 0) {
        const payRes = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: selectedBooking._id,
            amount: paymentAmount,
            paymentMethod: "Cash",
            notes: "Collected at check-in",
          }),
        });
        if (!payRes.ok) throw new Error("Failed to record advance payment");
      }

      // 4. Execute Check-in
      const checkinRes = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: selectedBooking._id }),
      });

      if (checkinRes.ok) {
        alert("Guest checked in successfully! Folio created, rooms occupied.");
        setSelectedBooking(null);
        fetchReservations();
      } else {
        const err = await checkinRes.json();
        alert(err.error || "Failed to complete check-in");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "An error occurred during check-in");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Check-In Desk</h2>
          <p className="text-muted-foreground mt-1 text-sm">Verify details, assign rooms, collect payment, and activate stays.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReservations} disabled={loading} className="rounded-xl">
            <MdRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => router.push('/bookings?new=true&walkin=true')} className="rounded-xl shadow-md">
            <MdAdd className="mr-2 h-5 w-5" /> Walk-In Check-In
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reservations List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden h-[calc(100vh-200px)] flex flex-col">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Pending Arrivals</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
              ) : bookings.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-6">
                  <MdPeople className="h-10 w-10 opacity-20 mb-2" />
                  <p className="text-center text-sm">No reservations ready for check-in.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {bookings.map((booking) => (
                    <div 
                      key={booking._id} 
                      onClick={() => selectBooking(booking)}
                      className={`p-4 cursor-pointer hover:bg-muted/20 transition-colors ${
                        selectedBooking?._id === booking._id ? "bg-primary/5 border-l-4 border-primary" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-foreground">
                            {booking.guestId?.firstName} {booking.guestId?.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(booking.checkInDate).toLocaleDateString()} to {new Date(booking.checkOutDate).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          booking.status === 'Confirmed' ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Check-In Execution Dashboard */}
        <div className="lg:col-span-2 space-y-4">
          {selectedBooking ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
              
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                  <MdLogin className="text-primary h-4 w-4" />
                  Check-In Dashboard: {selectedBooking.guestId?.firstName} {selectedBooking.guestId?.lastName}
                </h3>
                <span className="text-xs font-bold text-muted-foreground">
                  Stay: {new Date(selectedBooking.checkInDate).toLocaleDateString()} - {new Date(selectedBooking.checkOutDate).toLocaleDateString()}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Missing Guest Info */}
                <div className="p-4 border border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-900/10 rounded-xl space-y-4">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs">1</span>
                    Guest Verification
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase font-bold text-rose-600 block mb-1">ID/Passport Required *</label>
                      <input 
                        type="text" 
                        value={missingId} 
                        onChange={(e) => setMissingId(e.target.value)} 
                        className="w-full p-2 text-sm bg-background border border-rose-500/50 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500" 
                        placeholder="Enter ID or Passport..."
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase font-bold text-muted-foreground block mb-1">Email (Optional)</label>
                      <input 
                        type="email" 
                        value={missingEmail} 
                        onChange={(e) => setMissingEmail(e.target.value)} 
                        className="w-full p-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" 
                        placeholder="Enter Email Address..."
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Room Assignment */}
                <div className="p-4 border border-border rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">2</span>
                      Room Assignment
                    </h4>
                    
                    <select 
                      value={packageId} 
                      onChange={e => handlePackageChange(e.target.value)} 
                      className="p-1.5 text-xs bg-background border border-input rounded-md max-w-[200px]"
                    >
                      <option value="">-- No Package --</option>
                      {packages.map((p) => (
                        <option key={p._id} value={p._id}>{p.packageName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {rooms.map((room) => {
                      const isSelected = selectedRoomIds.includes(room._id);
                      // If room is occupied/reserved by OTHERS, it's disabled. 
                      // If it's already part of THIS booking, it's selectable/deselectable.
                      const isOccupiedOrReserved = room.status !== "Available" && !isSelected;
                      
                      return (
                        <div 
                          key={room._id} 
                          onClick={() => !isOccupiedOrReserved && handleRoomSelection(room._id, room.pricePerNight)}
                          className={`p-2 rounded-lg border cursor-pointer select-none transition-all flex flex-col justify-between h-20 ${
                            isSelected 
                              ? "bg-primary border-primary text-primary-foreground shadow-sm"
                              : isOccupiedOrReserved
                              ? "bg-muted border-muted text-muted-foreground cursor-not-allowed opacity-50"
                              : "bg-background border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-center font-bold">{room.roomNumber}</div>
                          <div className="text-[9px] text-center uppercase font-medium leading-tight">
                            {room.roomType}<br/>{room.category}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Payment Collection */}
                <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/10">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-xs">3</span>
                    Payment Collection
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground uppercase font-bold">Total Estimated</div>
                      <div className="text-xl font-bold">${calculatedTotal}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground uppercase font-bold">Already Paid</div>
                      <div className="text-xl font-bold text-emerald-600">${selectedBooking.advancePayment || 0}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-rose-600 uppercase font-bold">Payment to Collect</div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                        <input 
                          type="number" 
                          min="0"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          className="w-full pl-7 pr-3 py-2 text-lg font-bold bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      {pendingAmount > 0 && <p className="text-[10px] text-muted-foreground">Pending Balance: ${pendingAmount}</p>}
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-4 border-t border-border bg-muted/30">
                <Button onClick={handleCheckIn} className="w-full rounded-xl shadow-lg h-14 text-lg font-bold">
                  <MdLogin className="mr-2 h-6 w-6" />
                  Complete Check-In
                </Button>
              </div>

            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
              <MdMeetingRoom className="h-16 w-16 opacity-20 mb-4" />
              <p className="text-lg">Select a reservation to begin check-in.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
