"use client";

import { useState, useEffect } from "react";
import { 
  MdBookOnline, 
  MdAdd, 
  MdRefresh, 
  MdEdit, 
  MdDelete, 
  MdCheckCircle, 
  MdCancel, 
  MdOutlineHelpOutline, 
  MdOutlineTimer,
  MdSearch
} from "react-icons/md";
import { Button } from "@/components/ui/button";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bookingSearchQuery, setBookingSearchQuery] = useState("");

  const filteredBookings = bookings.filter(b => {
    const searchStr = `${b.guestId?.firstName} ${b.guestId?.lastName} ${b.guestId?.idPassportNumber} ${b.roomIds?.map((r: any) => r.roomNumber).join(" ")} ${b.status} ${b.packageId?.packageName || ""}`.toLowerCase();
    return searchStr.includes(bookingSearchQuery.toLowerCase());
  });

  // Form Fields
  const [guestId, setGuestId] = useState("");
  const [guestSearch, setGuestSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNewGuest, setIsNewGuest] = useState(false);
  const [newGuestFirstName, setNewGuestFirstName] = useState("");
  const [newGuestLastName, setNewGuestLastName] = useState("");
  const [newGuestIdPassport, setNewGuestIdPassport] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [roomRates, setRoomRates] = useState<{ [roomId: string]: number }>({});
  const [packageId, setPackageId] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [status, setStatus] = useState("Reserved");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resB, resG, resR, resP] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/guests"),
        fetch("/api/rooms"),
        fetch("/api/room-packages"),
      ]);

      const dataB = await resB.json();
      const dataG = await resG.json();
      const dataR = await resR.json();
      const dataP = await resP.json();

      setBookings(Array.isArray(dataB) ? dataB : []);
      setGuests(Array.isArray(dataG) ? dataG : []);
      setRooms(Array.isArray(dataR) ? dataR : []);
      setPackages(Array.isArray(dataP) ? dataP : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("new") === "true") {
        setShowForm(true);
        if (urlParams.get("walkin") === "true") {
          setStatus("Checked In");
          setCheckInDate(new Date().toISOString().split("T")[0]);
        }
      }
    }
  }, []);

  const handleRoomSelection = (roomId: string, price: number) => {
    if (selectedRoomIds.includes(roomId)) {
      setSelectedRoomIds(selectedRoomIds.filter(id => id !== roomId));
      const updatedRates = { ...roomRates };
      delete updatedRates[roomId];
      setRoomRates(updatedRates);
    } else {
      setSelectedRoomIds([...selectedRoomIds, roomId]);
      setRoomRates({ ...roomRates, [roomId]: price });
    }
  };

  const handlePackageChange = (pkgId: string) => {
    setPackageId(pkgId);
    if (!pkgId) return;
    
    const selectedPkg = packages.find(p => p._id === pkgId);
    if (selectedPkg) {
      // Find matching rooms of the package type & category
      const matchingRooms = rooms.filter(
        r => r.roomType === selectedPkg.roomType && r.category === selectedPkg.category && r.status === "Available"
      );
      
      if (matchingRooms.length > 0) {
        // Automatically select the first available matching room
        const firstRoom = matchingRooms[0];
        setSelectedRoomIds([firstRoom._id]);
        setRoomRates({ [firstRoom._id]: selectedPkg.pricePerNight });
      } else {
        alert(`No available rooms found for package type: ${selectedPkg.roomType} (${selectedPkg.category})`);
        setSelectedRoomIds([]);
        setRoomRates({});
      }
    }
  };

  // Calculate booking estimated total
  const calculateEstimatedTotal = () => {
    if (!checkInDate || !checkOutDate || selectedRoomIds.length === 0) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const timeDiff = end.getTime() - start.getTime();
    let nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (nights <= 0) nights = 1;

    const sumRoomRates = Object.values(roomRates).reduce((sum, rate) => sum + rate, 0);
    return sumRoomRates * nights;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let resolvedGuestId = guestId;
    if (isNewGuest) {
      if (!newGuestFirstName || !newGuestLastName || !newGuestPhone) {
        return alert("Please fill in all required guest fields (First Name, Last Name, and Phone).");
      }
      try {
        const guestRes = await fetch("/api/guests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: newGuestFirstName,
            lastName: newGuestLastName,
            idPassportNumber: newGuestIdPassport,
            phone: newGuestPhone,
            email: newGuestEmail || undefined,
          }),
        });
        const guestData = await guestRes.json();
        if (!guestRes.ok) {
          return alert(guestData.error || "Failed to register new guest.");
        }
        resolvedGuestId = guestData._id;
      } catch (err) {
        console.error(err);
        return alert("Failed to register new guest.");
      }
    } else {
      if (!resolvedGuestId && guestSearch) {
        const searchLower = guestSearch.trim().toLowerCase();
        const matches = guests.filter((g) => {
          const fullName = `${g.firstName} ${g.lastName}`.toLowerCase();
          const fullLabel = `${g.firstName} ${g.lastName} (${g.idPassportNumber})`.toLowerCase();
          return (
            fullName === searchLower ||
            fullLabel === searchLower ||
            g.idPassportNumber.toLowerCase() === searchLower ||
            g.phone === searchLower
          );
        });

        if (matches.length > 0) {
          resolvedGuestId = matches[0]._id;
          setGuestId(resolvedGuestId);
          setGuestSearch(`${matches[0].firstName} ${matches[0].lastName} (${matches[0].idPassportNumber})`);
        } else {
          const partialMatches = guests.filter((g) => {
            const searchStr = `${g.firstName} ${g.lastName} ${g.idPassportNumber} ${g.phone}`.toLowerCase();
            return searchStr.includes(searchLower);
          });
          if (partialMatches.length === 1) {
            resolvedGuestId = partialMatches[0]._id;
            setGuestId(resolvedGuestId);
            setGuestSearch(`${partialMatches[0].firstName} ${partialMatches[0].lastName} (${partialMatches[0].idPassportNumber})`);
          }
        }
      }

      if (!resolvedGuestId) {
        return alert("Please select a valid guest from the suggestion list or enter a matching guest name/passport.");
      }
    }

    // Date range validation
    const todayStr = new Date().toISOString().split("T")[0];
    if (!editingId && checkInDate < todayStr) {
      return alert("Check-In date cannot be in the past.");
    }
    if (checkOutDate <= checkInDate) {
      return alert("Check-Out date must be after the Check-In date.");
    }



    if (selectedRoomIds.length === 0) return alert("Please select at least one room");

    try {
      const url = editingId ? `/api/bookings/${editingId}` : "/api/bookings";
      const method = editingId ? "PUT" : "POST";

      const totalAmount = calculateEstimatedTotal();

      const body = {
        guestId: resolvedGuestId,
        roomIds: selectedRoomIds,
        roomPrices: Object.entries(roomRates).map(([roomId, price]) => ({ roomId, price })),
        packageId: packageId || undefined,
        checkInDate,
        checkOutDate,
        numberOfGuests: Number(numberOfGuests),
        advancePayment: Number(advancePayment),
        totalAmount,
        status,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        fetchData();
        resetForm();
      } else {
        const error = await res.json();
        let errorMsg = error.error || `Failed to ${editingId ? "update" : "create"} booking`;
        if (error.details) {
          errorMsg += "\nDetails: " + JSON.stringify(error.details, null, 2);
        }
        alert(errorMsg);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (booking: any) => {
    setEditingId(booking._id);
    setGuestId(booking.guestId?._id || "");
    if (booking.guestId) {
      setGuestSearch(`${booking.guestId.firstName} ${booking.guestId.lastName} (${booking.guestId.idPassportNumber})`);
    } else {
      setGuestSearch("");
    }
    setSelectedRoomIds(booking.roomIds?.map((r: any) => r._id) || []);
    
    const rates: { [roomId: string]: number } = {};
    booking.roomPrices?.forEach((rp: any) => {
      rates[rp.roomId] = rp.price;
    });
    setRoomRates(rates);

    setPackageId(booking.packageId?._id || "");
    setCheckInDate(booking.checkInDate ? new Date(booking.checkInDate).toISOString().split("T")[0] : "");
    setCheckOutDate(booking.checkOutDate ? new Date(booking.checkOutDate).toISOString().split("T")[0] : "");
    setNumberOfGuests(booking.numberOfGuests || 1);
    setAdvancePayment(booking.advancePayment || 0);
    setStatus(booking.status || "Reserved");
    setShowForm(true);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update booking status");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete booking");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setGuestId("");
    setGuestSearch("");
    setShowSuggestions(false);
    setIsNewGuest(false);
    setNewGuestFirstName("");
    setNewGuestLastName("");
    setNewGuestIdPassport("");
    setNewGuestPhone("");
    setNewGuestEmail("");
    setSelectedRoomIds([]);
    setRoomRates({});
    setPackageId("");
    setCheckInDate("");
    setCheckOutDate("");
    setNumberOfGuests(1);
    setAdvancePayment(0);
    setStatus("Reserved");
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bookings Management</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage multi-room guest bookings and packages.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading} className="rounded-xl">
            <MdRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => showForm ? cancelForm() : setShowForm(true)} className="rounded-xl shadow-md">
            {showForm ? "Cancel" : <><MdAdd className="mr-2 h-5 w-5" /> New Booking</>}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">{editingId ? "Edit Booking" : "New Booking"}</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Guest Selection Mode Toggle */}
              <div className="col-span-full bg-muted/40 p-3.5 rounded-2xl border border-border/50 mb-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Guest Options</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewGuest(false)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      !isNewGuest 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "bg-background border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Search Existing Guest
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewGuest(true)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      isNewGuest 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "bg-background border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Register New Guest
                  </button>
                </div>
              </div>

              {!isNewGuest ? (
                /* Searchable Guest Autocomplete Input */
                <div className="relative col-span-full md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Guest *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required={!isNewGuest}
                      value={guestSearch}
                      placeholder="Type name, passport or phone..."
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onChange={(e) => {
                        setGuestSearch(e.target.value);
                        setGuestId(""); // Clear selection till a suggestion is clicked
                        setShowSuggestions(true);
                      }}
                      className="w-full p-2.5 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {guestId && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        Selected
                      </span>
                    )}
                  </div>
                  
                  {/* Suggestions List */}
                  {showSuggestions && guestSearch && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-lg divide-y divide-border">
                      {guests
                        .filter((g) => {
                          const searchStr = `${g.firstName} ${g.lastName} ${g.idPassportNumber} ${g.phone}`.toLowerCase();
                          return searchStr.includes(guestSearch.toLowerCase());
                        })
                        .map((g) => (
                          <div
                            key={g._id}
                            onMouseDown={() => {
                              setGuestId(g._id);
                              setGuestSearch(`${g.firstName} ${g.lastName} (${g.idPassportNumber})`);
                              setShowSuggestions(false);
                            }}
                            className="p-3 cursor-pointer hover:bg-muted/50 text-xs flex flex-col gap-0.5"
                          >
                            <div className="font-bold text-foreground">
                              {g.firstName} {g.lastName}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex justify-between">
                              <span>ID/Passport: {g.idPassportNumber}</span>
                              <span>Phone: {g.phone}</span>
                            </div>
                          </div>
                        ))}
                      {guests.filter((g) => {
                        const searchStr = `${g.firstName} ${g.lastName} ${g.idPassportNumber} ${g.phone}`.toLowerCase();
                        return searchStr.includes(guestSearch.toLowerCase());
                      }).length === 0 && (
                        <div className="p-3 text-xs text-muted-foreground text-center">
                          No matching guests found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* New Guest Registration Form Fields */
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
                  <div className="col-span-full">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">New Guest Quick Registration</h4>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">First Name *</label>
                    <input
                      type="text"
                      required={isNewGuest}
                      value={newGuestFirstName}
                      onChange={(e) => setNewGuestFirstName(e.target.value)}
                      className="w-full p-2 bg-background border border-input rounded-md"
                      placeholder="e.g. John"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Last Name *</label>
                    <input
                      type="text"
                      required={isNewGuest}
                      value={newGuestLastName}
                      onChange={(e) => setNewGuestLastName(e.target.value)}
                      className="w-full p-2 bg-background border border-input rounded-md"
                      placeholder="e.g. Doe"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone Number *</label>
                    <input
                      type="text"
                      required={isNewGuest}
                      value={newGuestPhone}
                      onChange={(e) => setNewGuestPhone(e.target.value)}
                      className="w-full p-2 bg-background border border-input rounded-md"
                      placeholder="e.g. +94771234567"
                    />
                  </div>

                </div>
              )}

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Package Selector */}
              <div>
                <label className="text-sm font-medium mb-1 block">Room Package (Optional)</label>
                <select 
                  value={packageId} 
                  onChange={e => handlePackageChange(e.target.value)} 
                  className="w-full p-2 bg-background border border-input rounded-md"
                >
                  <option value="">-- No Package (Custom Rooms) --</option>
                  {packages.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.packageName} (${p.pricePerNight}/night) - {p.roomType} {p.category}
                    </option>
                  ))}
                  {packages.length === 0 && <option value="" disabled>No packages configured</option>}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)} 
                  className="w-full p-2 bg-background border border-input rounded-md"
                >
                  <option value="Reserved">Reserved</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked In">Checked In</option>
                  <option value="Checked Out">Checked Out</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>

              {/* Check-In Date */}
              <div>
                <label className="text-sm font-medium mb-1 block">Check-In Date *</label>
                <input 
                  type="date" 
                  required 
                  min={new Date().toISOString().split("T")[0]}
                  value={checkInDate} 
                  onChange={e => setCheckInDate(e.target.value)} 
                  className="w-full p-2 bg-background border border-input rounded-md" 
                />
              </div>

              {/* Check-Out Date */}
              <div>
                <label className="text-sm font-medium mb-1 block">Check-Out Date *</label>
                <input 
                  type="date" 
                  required 
                  min={checkInDate || new Date().toISOString().split("T")[0]}
                  value={checkOutDate} 
                  onChange={e => setCheckOutDate(e.target.value)} 
                  className="w-full p-2 bg-background border border-input rounded-md" 
                />
              </div>

              {/* Number of Guests */}
              <div>
                <label className="text-sm font-medium mb-1 block">Number of Guests *</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  value={numberOfGuests} 
                  onChange={e => setNumberOfGuests(Number(e.target.value))} 
                  className="w-full p-2 bg-background border border-input rounded-md" 
                />
              </div>

              {/* Advance Payment */}
              <div>
                <label className="text-sm font-medium mb-1 block">Advance Payment ($)</label>
                <input 
                  type="number" 
                  min="0"
                  value={advancePayment} 
                  onChange={e => setAdvancePayment(Number(e.target.value))} 
                  className="w-full p-2 bg-background border border-input rounded-md" 
                />
              </div>
            </div>

            {/* Room Selector Grid */}
            <div className="border border-border rounded-xl p-4 bg-muted/20">
              <h4 className="font-semibold text-sm mb-3">Select Rooms *</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {rooms.map((room) => {
                  const isSelected = selectedRoomIds.includes(room._id);
                  const isOccupiedOrReserved = room.status !== "Available" && !selectedRoomIds.includes(room._id);
                  
                  return (
                    <div 
                      key={room._id} 
                      onClick={() => !isOccupiedOrReserved && handleRoomSelection(room._id, room.pricePerNight)}
                      className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                        isSelected 
                          ? "bg-primary border-primary text-primary-foreground shadow-md"
                          : isOccupiedOrReserved
                          ? "bg-muted border-muted text-muted-foreground cursor-not-allowed opacity-55"
                          : "bg-background border-border hover:border-primary/50 text-foreground"
                      }`}
                    >
                      <div className="text-center font-bold text-lg">{room.roomNumber}</div>
                      <div className="text-[10px] text-center mt-1 uppercase font-medium">
                        {room.roomType} - {room.category}
                      </div>
                      <div className="text-xs text-center font-bold mt-2">
                        ${room.pricePerNight}/night
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Override rates section */}
              {selectedRoomIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <h5 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Adjust Price overrides per Room</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedRoomIds.map((rid) => {
                      const roomObj = rooms.find(r => r._id === rid);
                      if (!roomObj) return null;
                      return (
                        <div key={rid} className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border">
                          <span className="font-bold text-xs">Room {roomObj.roomNumber}:</span>
                          <input 
                            type="number"
                            min="0"
                            value={roomRates[rid] || 0}
                            onChange={(e) => setRoomRates({ ...roomRates, [rid]: Number(e.target.value) })}
                            className="w-20 p-1 border border-input rounded text-xs bg-background"
                          />
                          <span className="text-xs text-muted-foreground">/night</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Estimated Total</p>
                <p className="text-3xl font-extrabold text-primary">${calculateEstimatedTotal()}</p>
              </div>
              <Button type="submit" className="px-8 rounded-xl shadow-md h-11 text-base font-bold">
                {editingId ? "Update Booking" : "Confirm & Save Booking"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input 
            type="text" 
            placeholder="Search bookings by guest name, room, status or package..." 
            value={bookingSearchQuery}
            onChange={(e) => setBookingSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
            <MdBookOnline className="h-10 w-10 opacity-20 mb-2" />
            <p>{bookings.length === 0 ? "No bookings found. Create a booking to get started!" : "No bookings match your search."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Guest</th>
                  <th className="px-6 py-4 font-semibold">Rooms</th>
                  <th className="px-6 py-4 font-semibold">Stay Dates</th>
                  <th className="px-6 py-4 font-semibold">Finances</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const checkIn = new Date(booking.checkInDate).toLocaleDateString();
                  const checkOut = new Date(booking.checkOutDate).toLocaleDateString();
                  
                  return (
                    <tr key={booking._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">
                          {booking.guestId ? `${booking.guestId.firstName} ${booking.guestId.lastName}` : "Deleted Guest"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {booking.guestId?.idPassportNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {booking.roomIds?.map((room: any) => (
                            <span key={room._id} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold">
                              {room.roomNumber}
                            </span>
                          ))}
                        </div>
                        {booking.packageId && (
                          <span className="text-[10px] text-accent font-bold uppercase tracking-wider block mt-1">
                            Pkg: {booking.packageId.packageName}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-foreground">{checkIn} to {checkOut}</span>
                          <span className="text-muted-foreground mt-0.5 font-medium flex items-center gap-1">
                            <MdOutlineTimer className="w-3.5 h-3.5"/>
                            {Math.ceil(Math.abs(new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 3600 * 24))} nights
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <div>Total: <span className="font-bold text-foreground">${booking.totalAmount}</span></div>
                          <div className="text-muted-foreground mt-0.5">Advance: <span className="font-bold">${booking.advancePayment}</span></div>
                          <div className="mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              booking.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' :
                              booking.paymentStatus === 'Partially Paid' ? 'bg-blue-500/10 text-blue-600' :
                              'bg-rose-500/10 text-rose-600'
                            }`}>
                              {booking.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'Checked In' ? 'bg-emerald-500/15 text-emerald-600' :
                          booking.status === 'Checked Out' ? 'bg-slate-500/15 text-slate-600' :
                          booking.status === 'Reserved' ? 'bg-blue-500/15 text-blue-600' :
                          booking.status === 'Confirmed' ? 'bg-purple-500/15 text-purple-600' :
                          'bg-rose-500/15 text-rose-600'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {/* Status Transition buttons */}
                        {booking.status === "Reserved" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleStatusChange(booking._id, "Confirmed")}
                            title="Confirm Booking"
                            className="h-8 w-8 text-purple-600 hover:bg-purple-50"
                          >
                            <MdCheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {["Reserved", "Confirmed"].includes(booking.status) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleStatusChange(booking._id, "Cancelled")}
                            title="Cancel Booking"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                          >
                            <MdCancel className="h-4 w-4" />
                          </Button>
                        )}
                        {booking.status === "Confirmed" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleStatusChange(booking._id, "No Show")}
                            title="Mark No Show"
                            className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                          >
                            <MdOutlineHelpOutline className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(booking)} className="h-8 w-8 ml-1 text-muted-foreground hover:text-primary">
                          <MdEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(booking._id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <MdDelete className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
