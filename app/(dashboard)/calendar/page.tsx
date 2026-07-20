"use client";

import { useState, useEffect } from "react";
import { MdChevronLeft, MdChevronRight, MdToday } from "react-icons/md";
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date state (Start date of the 14-day view)
  const [startDate, setStartDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [roomsRes, bookingsRes] = await Promise.all([
          fetch("/api/rooms"),
          fetch("/api/bookings")
        ]);
        setRooms(await roomsRes.json());
        setBookings(await bookingsRes.json());
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Generate the 14 dates
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const goNext = () => {
    const next = new Date(startDate);
    next.setDate(next.getDate() + 7); // Jump a week
    setStartDate(next);
  };

  const goPrev = () => {
    const prev = new Date(startDate);
    prev.setDate(prev.getDate() - 7);
    setStartDate(prev);
  };

  const goToday = () => setStartDate(new Date());

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  // Helper to format date header
  const formatDateHeader = (d: Date) => {
    return {
      dayStr: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateNum: d.getDate(),
      monthStr: d.toLocaleDateString("en-US", { month: "short" })
    };
  };

  // Helper to find if a booking occupies a specific room on a specific date
  // For rendering blocks, we actually want to span columns, but for simplicity in a custom grid without heavy libs, 
  // we can calculate the style (left, width) based on the date array index.
  
  const getBookingStyle = (booking: any, room: any) => {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    
    // Normalize time to midnight for accurate day comparison
    checkIn.setHours(0,0,0,0);
    checkOut.setHours(0,0,0,0);
    const viewStart = new Date(dates[0]);
    viewStart.setHours(0,0,0,0);
    const viewEnd = new Date(dates[13]);
    viewEnd.setHours(0,0,0,0);

    // If booking is outside the current 14 day view entirely
    if (checkOut <= viewStart || checkIn > viewEnd) return null;

    // Calculate start position (0 to 13)
    let startIndex = 0;
    if (checkIn > viewStart) {
      startIndex = Math.round((checkIn.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Calculate end position (0 to 13)
    let endIndex = 14;
    if (checkOut <= viewEnd) {
      endIndex = Math.round((checkOut.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24));
    }

    // A check-out day doesn't consume the night, so width is endIndex - startIndex
    let span = endIndex - startIndex;
    if (span <= 0) span = 1; // Minimum 1 day block (e.g. day use)

    // Colors based on status
    let bgColor = "bg-blue-500/90 hover:bg-blue-600 border-blue-600";
    if (booking.status === "Confirmed") bgColor = "bg-emerald-500/90 hover:bg-emerald-600 border-emerald-600";
    if (booking.status === "Pending") bgColor = "bg-amber-500/90 hover:bg-amber-600 border-amber-600";
    if (booking.status === "Checked Out") bgColor = "bg-slate-500/90 hover:bg-slate-600 border-slate-600";

    return {
      left: `${(startIndex / 14) * 100}%`,
      width: `${(span / 14) * 100}%`,
      bgColor
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Interactive Calendar</h2>
          <p className="text-muted-foreground mt-1 text-sm">Visual timeline of all room allocations.</p>
        </div>
        <div className="flex items-center space-x-2 bg-card border border-border p-1 rounded-xl shadow-sm">
          <Button variant="ghost" size="icon" onClick={goPrev}><MdChevronLeft className="h-6 w-6" /></Button>
          <Button variant="ghost" onClick={goToday} className="flex items-center gap-2 px-4">
            <MdToday className="h-4 w-4" /> Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goNext}><MdChevronRight className="h-6 w-6" /></Button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading Timeline...</div>
        ) : (
          <>
            {/* Header Row (Dates) */}
            <div className="flex border-b border-border bg-muted/30">
              <div className="w-[150px] shrink-0 border-r border-border p-4 flex items-end font-bold text-sm text-muted-foreground uppercase tracking-widest">
                Rooms
              </div>
              <div className="flex-1 grid grid-cols-14" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
                {dates.map((d, i) => {
                  const { dayStr, dateNum, monthStr } = formatDateHeader(d);
                  const today = isToday(d);
                  return (
                    <div key={i} className={`p-2 border-r border-border last:border-r-0 flex flex-col items-center justify-center ${today ? 'bg-primary/10' : ''}`}>
                      <span className={`text-[10px] font-bold uppercase ${today ? 'text-primary' : 'text-muted-foreground'}`}>{dayStr}</span>
                      <span className={`text-xl font-black ${today ? 'text-primary' : 'text-foreground'}`}>{dateNum}</span>
                      <span className="text-[10px] text-muted-foreground">{monthStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {rooms.sort((a,b) => (a.roomNumber || "").localeCompare(b.roomNumber || "")).map((room) => {
                // Find bookings for this room
                const roomBookings = bookings.filter(b => b.rooms?.some((r: any) => r.roomId === room._id || r === room._id));

                return (
                  <div key={room._id} className="flex border-b border-border hover:bg-muted/10 transition-colors group">
                    {/* Room Info Column */}
                    <div className="w-[150px] shrink-0 border-r border-border p-3 flex flex-col justify-center bg-card z-10">
                      <span className="font-bold text-foreground">Room {room.roomNumber}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{room.roomType} • {room.category}</span>
                    </div>

                    {/* Timeline Cells Row */}
                    <div className="flex-1 relative">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 grid grid-cols-14 pointer-events-none" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
                        {dates.map((_, i) => (
                          <div key={i} className="border-r border-border/50 h-full last:border-r-0" />
                        ))}
                      </div>

                      {/* Booking Blocks */}
                      <div className="absolute inset-0 top-1 bottom-1">
                        {roomBookings.map((booking) => {
                          const style = getBookingStyle(booking, room);
                          if (!style) return null;

                          return (
                            <div 
                              key={booking._id} 
                              className={`absolute h-full rounded-md border text-white text-xs font-semibold p-1.5 overflow-hidden shadow-sm flex flex-col justify-center cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md z-10 ${style.bgColor}`}
                              style={{ left: style.left, width: style.width }}
                              title={`Guest: ${booking.guest?.name || 'Unknown'}\nStatus: ${booking.status}`}
                            >
                              <div className="truncate drop-shadow-md">{booking.guest?.name || 'Walk-in'}</div>
                              <div className="text-[9px] opacity-90 truncate drop-shadow-md">{booking.status}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-4 text-xs font-semibold text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-500/90" /> Pending</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500/90" /> Confirmed</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500/90" /> Checked In</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-500/90" /> Checked Out</div>
      </div>
    </div>
  );
}
