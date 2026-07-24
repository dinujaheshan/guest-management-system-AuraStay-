"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  MdCalendarToday,
  MdPeople,
  MdClass,
  MdPayment,
  MdHistory,
  MdPrint,
  MdCheckCircle,
  MdAccessTime,
  MdHelpOutline,
  MdHome,
  MdDarkMode,
  MdLightMode,
  MdOutlineBedroomParent,
  MdInfo,
  MdOutlineAttachMoney,
  MdOutlineRateReview,
  MdArrowForward,
} from "react-icons/md";

interface IGuest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
}

interface IRoom {
  _id: string;
  roomNumber: string;
  roomType: string;
  category: string;
}

interface IPackage {
  _id: string;
  packageName: string;
  pricePerNight: number;
}

interface IBooking {
  _id: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  status: "Reserved" | "Confirmed" | "Checked In" | "Checked Out" | "Cancelled" | "No Show";
  advancePayment: number;
  totalAmount: number;
  paymentStatus: "Pending" | "Partially Paid" | "Paid" | "Refunded";
  guestId: IGuest;
  roomIds: IRoom[];
  packageId?: IPackage;
}

interface IPayment {
  _id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  notes?: string;
  date: string;
}

interface IBusinessSetting {
  businessName: string;
  logo?: string;
  checkInTime: string;
  checkOutTime: string;
}

// Geometric Premium Hotel SVG Logo Component
const HotelLogo = () => (
  <svg className="w-9 h-9 transition-transform duration-300 hover:rotate-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 12L15 42H85L50 12Z" fill="currentColor" className="text-teal-600 dark:text-teal-400" />
    <rect x="24" y="47" width="52" height="42" rx="6" fill="currentColor" className="text-teal-700/80 dark:text-teal-500/80" />
    <path d="M43 89V67H57V89H43Z" fill="currentColor" className="text-amber-500 dark:text-amber-400" />
    <circle cx="50" cy="29" r="5" fill="currentColor" className="text-amber-400" />
  </svg>
);

export default function PublicBookingPage() {
  const { id } = useParams();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [bookingData, setBookingData] = useState<{ booking: IBooking; payments: IPayment[]; businessSettings: IBusinessSetting } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent NextJS Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/bookings/${id}`);
        if (!response.ok) {
          throw new Error("Unable to retrieve booking details. Please verify the link.");
        }
        const data = await response.json();
        setBookingData(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center p-6">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
          <HotelLogo />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading guest details...</p>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center p-6 text-center">
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-3xl max-w-md w-full mb-6 shadow-xl">
          <MdInfo className="text-red-500 dark:text-red-400 w-14 h-14 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-2">Booking Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {error || "We could not locate this booking. Please verify that the link sent to you is correct."}
          </p>
        </div>
        <a
          href="/"
          className="px-6 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-600 dark:text-teal-400 font-semibold border border-teal-500/30 rounded-2xl shadow-sm transition-all duration-300"
        >
          Return to Website
        </a>
      </div>
    );
  }

  const { booking, payments, businessSettings } = bookingData;
  const guestName = booking.guestId ? `${booking.guestId.firstName} ${booking.guestId.lastName}` : "Guest";

  // Date Formatting helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Stay Nights calculation
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

  // Payment Math
  const totalPaid = (booking.advancePayment || 0) + payments.reduce((sum, p) => sum + (p.status === "Paid" ? p.amount : 0), 0);
  const outstandingBalance = Math.max(0, booking.totalAmount - totalPaid);
  const paidPercentage = Math.min(100, Math.round((totalPaid / booking.totalAmount) * 100));

  // Status Badges configuration
  const statusConfig = {
    Reserved: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    Confirmed: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    "Checked In": "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    "Checked Out": "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700/50",
    Cancelled: "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20",
    "No Show": "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 pb-20 selection:bg-teal-500/20 selection:text-teal-700 dark:selection:text-teal-300">
      {/* Decorative Top Mesh Background */}
      <div className="absolute top-0 inset-x-0 h-[450px] bg-gradient-to-b from-teal-500/5 dark:from-teal-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Navigation bar */}
      <nav className="relative max-w-6xl mx-auto px-6 py-5 flex justify-between items-center border-b border-slate-200 dark:border-slate-900 z-10">
        <div className="flex items-center gap-3">
          {businessSettings.logo ? (
            <img src={businessSettings.logo} alt={businessSettings.businessName} className="h-9 object-contain" />
          ) : (
            <HotelLogo />
          )}
          <div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent dark:from-teal-400 dark:to-emerald-400">
              {businessSettings.businessName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Light/Dark Toggle Switch */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <MdLightMode className="w-5 h-5 text-amber-400 animate-spin-slow" /> : <MdDarkMode className="w-5 h-5 text-indigo-600" />}
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-950 dark:hover:bg-teal-900 text-white dark:text-teal-300 font-semibold border border-teal-500/10 dark:border-teal-500/20 rounded-2xl text-sm shadow-md shadow-teal-500/10 transition-all duration-300 active:scale-95 z-10"
          >
            <MdPrint className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Print Receipt</span>
          </button>
        </div>
      </nav>

      {/* Main Section */}
      <main className="relative max-w-6xl mx-auto px-6 mt-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-8"
        >
          {/* Welcome Card & Luxury Hero Banner */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-900 rounded-[32px] overflow-hidden shadow-xl shadow-slate-100 dark:shadow-black/25">
            {/* Unsplash Luxury Room Banner */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80"
                alt="Luxury Hotel Room"
                className="w-full h-full object-cover transition-transform duration-10000 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 md:left-8 flex flex-col gap-1.5">
                <div className="px-3.5 py-1 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider rounded-lg w-max flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Booking Overview
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm mt-1">
                  Welcome, {guestName}
                </h1>
                <p className="text-slate-300 text-xs md:text-sm drop-shadow-sm font-medium">
                  We are delighted to host you. Here are your reservation and billing records.
                </p>
              </div>

              {/* Status Badge Overlaid */}
              <div className="absolute bottom-6 right-6 md:right-8 hidden sm:block">
                <span
                  className={`px-4.5 py-2 rounded-2xl border text-sm font-bold shadow-2xl backdrop-blur-md inline-flex items-center gap-2 ${
                    statusConfig[booking.status] || "bg-slate-800 text-slate-200"
                  }`}
                >
                  {booking.status === "Confirmed" && <MdCheckCircle className="w-4 h-4" />}
                  {booking.status === "Reserved" && <MdAccessTime className="w-4 h-4" />}
                  <span>{booking.status} Booking</span>
                </span>
              </div>
            </div>

            {/* Mobile Status Badge Banner */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex sm:hidden justify-between items-center">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Booking Status</span>
              <span
                className={`px-3 py-1 rounded-xl border text-xs font-bold inline-flex items-center gap-1 ${
                  statusConfig[booking.status] || "bg-slate-800 text-slate-200"
                }`}
              >
                <span>{booking.status}</span>
              </span>
            </div>
          </div>

          {/* Details Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Stay Info & Rooms (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              {/* Stay Details Card */}
              <div className="bg-white dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200 dark:border-slate-900 rounded-[28px] p-6 md:p-8 shadow-md shadow-slate-100/50 dark:shadow-none hover:shadow-lg transition-all duration-300">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5">
                  <div className="p-2 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
                    <MdCalendarToday className="w-5 h-5" />
                  </div>
                  <span>Reservation Details</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-150 dark:border-slate-900 hover:border-teal-500/20 transition-all duration-200">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                      Check-In Date
                    </span>
                    <span className="text-base font-extrabold text-slate-950 dark:text-white">{formatDate(booking.checkInDate)}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1.5 font-medium">
                      Check-in starts {businessSettings.checkInTime}
                    </span>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-150 dark:border-slate-900 hover:border-teal-500/20 transition-all duration-200">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                      Check-Out Date
                    </span>
                    <span className="text-base font-extrabold text-slate-950 dark:text-white">{formatDate(booking.checkOutDate)}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1.5 font-medium">
                      Check-out before {businessSettings.checkOutTime}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-6 border-t border-slate-150 dark:border-slate-900/60 text-center">
                  <div className="bg-slate-50 dark:bg-slate-950/30 py-3 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Duration</span>
                    <span className="text-base font-black text-teal-600 dark:text-teal-400 mt-1 block">{nights} {nights > 1 ? 'Nights' : 'Night'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/30 py-3 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Guests</span>
                    <span className="text-base font-black text-slate-950 dark:text-white mt-1 block flex items-center justify-center gap-1">
                      <MdPeople className="w-5 h-5 text-slate-400" />
                      {booking.numberOfGuests}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/30 py-3 rounded-xl px-1">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Package</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 block truncate">
                      {booking.packageId?.packageName || "Standard"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Rooms Card */}
              <div className="bg-white dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200 dark:border-slate-900 rounded-[28px] p-6 md:p-8 shadow-md shadow-slate-100/50 dark:shadow-none hover:shadow-lg transition-all duration-300">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5">
                  <div className="p-2 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
                    <MdOutlineBedroomParent className="w-5 h-5" />
                  </div>
                  <span>Assigned Rooms</span>
                </h2>

                <div className="flex flex-col gap-4">
                  {booking.roomIds && booking.roomIds.length > 0 ? (
                    booking.roomIds.map((room) => (
                      <div
                        key={room._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-900 rounded-2xl hover:border-teal-500/30 hover:bg-slate-100/50 dark:hover:bg-slate-950/50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-teal-600 dark:bg-teal-950 text-white dark:text-teal-400 flex items-center justify-center font-black text-base shadow-sm">
                            {room.roomNumber}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-200">Room {room.roomNumber}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {room.roomType} Room
                            </p>
                          </div>
                        </div>

                        <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm">
                          {room.category}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Room allocations will appear here shortly.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Billing & Financial Summary (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              {/* Payment Summary */}
              <div className="bg-white dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200 dark:border-slate-900 rounded-[28px] p-6 md:p-8 shadow-md shadow-slate-100/50 dark:shadow-none hover:shadow-lg transition-all duration-300">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5">
                  <div className="p-2 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
                    <MdPayment className="w-5 h-5" />
                  </div>
                  <span>Billing Statement</span>
                </h2>

                {/* Progress bar of Paid Amount */}
                <div className="mb-6 bg-slate-50 dark:bg-slate-950/40 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-900">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Paid Coverage</span>
                    <span className="text-base font-black text-teal-600 dark:text-teal-400">{paidPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-3.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-600 to-emerald-450 dark:from-teal-500 dark:to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${paidPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-900">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Grand Total</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">LKR {booking.totalAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-900">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Advance Deposit</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">LKR {booking.advancePayment.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-900">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Payments Made</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">LKR {totalPaid.toLocaleString()}</span>
                  </div>

                  {outstandingBalance === 0 ? (
                    <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3">
                      <MdCheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Invoice Settled</h4>
                        <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80">No outstanding amount remaining on this booking.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest block">
                          Outstanding Balance
                        </span>
                        <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                          LKR {outstandingBalance.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 uppercase tracking-wide">
                        Pending
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transactions Timeline */}
              <div className="bg-white dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200 dark:border-slate-900 rounded-[28px] p-6 md:p-8 shadow-md shadow-slate-100/50 dark:shadow-none hover:shadow-lg transition-all duration-300">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5">
                  <div className="p-2 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
                    <MdHistory className="w-5 h-5" />
                  </div>
                  <span>Transaction Log</span>
                </h2>

                <div className="relative border-l-2 border-slate-250 dark:border-slate-900 ml-4 pl-6 flex flex-col gap-6.5">
                  {/* Item 1: Advance payment */}
                  {booking.advancePayment > 0 && (
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-teal-500 ring-4 ring-white dark:ring-slate-950 shadow-sm" />
                      <div>
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-200">Advance Deposit</h4>
                          <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400">
                            LKR {booking.advancePayment.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">Initial reservation confirmation deposit</p>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Payments List */}
                  {payments && payments.length > 0 ? (
                    payments.map((payment) => (
                      <div key={payment._id} className="relative">
                        <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full ring-4 ring-white dark:ring-slate-950 shadow-sm ${payment.status === 'Paid' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-200">
                              Payment ({payment.paymentMethod})
                            </h4>
                            <span className={`text-[11px] font-black ${payment.status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-650 dark:text-red-400'}`}>
                              LKR {payment.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[9px] text-slate-400 font-semibold">{formatDate(payment.date)}</span>
                            {payment.notes && (
                              <span className="text-[10px] italic text-slate-500 dark:text-slate-400 text-right truncate max-w-[170px]">
                                "{payment.notes}"
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : null}

                  {booking.advancePayment === 0 && (!payments || payments.length === 0) && (
                    <div className="relative -ml-6 pl-0 py-4 text-center">
                      <MdInfo className="w-6 h-6 text-slate-450 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500 dark:text-slate-400 text-xs">No transaction records found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Assistance & Contact Panel */}
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
                <MdHelpOutline className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-950 dark:text-white">Need assistance?</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mt-0.5">
                  Have questions about your checkout timing, payments, or amenity services? Speak directly with reception.
                </p>
              </div>
            </div>
            <a
              href="tel:+94771234567" // Placeholder or dynamic value
              className="px-5 py-2.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-teal-600 dark:text-teal-400 hover:text-teal-700 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 text-center transition-colors"
            >
              Contact Support
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
