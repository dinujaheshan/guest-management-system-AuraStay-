"use client";

import { useState, useEffect } from "react";
import { 
  MdBarChart, MdRefresh, MdTrendingUp, MdTrendingDown, 
  MdMonetizationOn, MdMeetingRoom, MdWarning, MdPieChart, 
  MdCheckCircle, MdAssignment, MdLogout, MdPeople, 
  MdAttachMoney, MdRestaurantMenu, MdPrint, MdReceipt, 
  MdPayment, MdInventory, MdAddCircle
} from "react-icons/md";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);

  // Data states
  const [reportData, setReportData] = useState<any | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [businessSetting, setBusinessSetting] = useState<any>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [reportsRes, bookingsRes, guestsRes, expensesRes, chargesRes, paymentsRes, invoicesRes, menuRes, businessRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/bookings"),
        fetch("/api/guests"),
        fetch("/api/expenses"),
        fetch("/api/charges"),
        fetch("/api/payments"),
        fetch("/api/invoices"),
        fetch("/api/menu-items"),
        fetch("/api/settings/business")
      ]);
      setReportData(await reportsRes.json());
      setBookings(await bookingsRes.json());
      setGuests(await guestsRes.json());
      setExpenses(await expensesRes.json());
      setCharges(await chargesRes.json());
      setPayments(await paymentsRes.json());
      setInvoices(await invoicesRes.json());
      setMenuItems(await menuRes.json());
      setBusinessSetting(await businessRes.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center text-muted-foreground">Loading Analytics & Reports...</div>;
  }

  const { finance, rooms, lowStockItems, walkInItems = [] } = reportData || {};

  const PrintHeader = ({ title }: { title: string }) => (
    <div className="hidden print:flex flex-col items-center justify-center mb-8 pb-6 border-b-2 border-slate-200">
      {businessSetting?.logo ? (
        <img src={businessSetting.logo} alt="Logo" className="h-20 object-contain mb-4" />
      ) : (
        <h1 className="text-3xl font-black text-slate-900">{businessSetting?.businessName || "My Guest House"}</h1>
      )}
      <h2 className="text-xl font-bold text-slate-600 mt-2 uppercase tracking-widest">{title}</h2>
      <div className="text-sm text-slate-400 mt-2 flex gap-4">
        <span>{businessSetting?.address}</span>
        <span>|</span>
        <span>{businessSetting?.phone}</span>
      </div>
      <div className="text-xs text-slate-400 font-medium mt-1">
        Generated on: {new Date().toLocaleString()}
      </div>
    </div>
  );

  // Tab views
  const renderOverview = () => {
    if (!reportData) return <div>No data</div>;
    return (
      <div className="space-y-6">
        {/* Financial Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</h3>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl"><MdTrendingUp className="h-5 w-5 text-emerald-600" /></div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-emerald-600">${finance.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Stays & POS collections</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</h3>
              <div className="p-2.5 bg-rose-500/10 rounded-xl"><MdTrendingDown className="h-5 w-5 text-rose-600" /></div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-rose-600">${finance.totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Utility & salary overheads</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Net Profit</h3>
              <div className="p-2.5 bg-primary/10 rounded-xl"><MdMonetizationOn className="h-5 w-5 text-primary" /></div>
            </div>
            <div className="mt-4">
              <div className={`text-3xl font-black ${finance.netProfit >= 0 ? "text-primary" : "text-rose-600"}`}>
                ${finance.netProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Margin: {finance.totalRevenue > 0 ? Math.round((finance.netProfit / finance.totalRevenue) * 100) : 0}%</p>
            </div>
          </div>
        </div>

        {/* System Lifetime Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <div className="bg-card rounded-2xl border border-border p-5 text-center shadow-sm">
            <div className="text-2xl font-black">{bookings.length}</div>
            <div className="text-xs text-muted-foreground uppercase font-bold mt-1">Total Bookings</div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 text-center shadow-sm">
            <div className="text-2xl font-black">{guests.length}</div>
            <div className="text-xs text-muted-foreground uppercase font-bold mt-1">Registered Guests</div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 text-center shadow-sm">
            <div className="text-2xl font-black">{invoices.length}</div>
            <div className="text-xs text-muted-foreground uppercase font-bold mt-1">Invoices Issued</div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 text-center shadow-sm">
            <div className="text-2xl font-black">{menuItems.length}</div>
            <div className="text-xs text-muted-foreground uppercase font-bold mt-1">Inventory Items</div>
          </div>
        </div>

        {/* Row 2: Occupancy vs Financial Splits */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card rounded-2xl border border-border p-6 lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b border-border pb-3">
              <MdMeetingRoom className="text-primary h-5 w-5" /> Room Occupancy Rate
            </h3>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="50" stroke="currentColor" className="text-muted/30" strokeWidth="12" fill="transparent" />
                  <circle cx="64" cy="64" r="50" stroke="currentColor" className="text-primary" strokeWidth="12" fill="transparent" strokeDasharray={2 * Math.PI * 50} strokeDashoffset={2 * Math.PI * 50 * (1 - rooms.occupancyRate / 100)} />
                </svg>
                <div className="absolute text-2xl font-black">{rooms.occupancyRate}%</div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 font-semibold uppercase">Currently Occupied</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b border-border pb-3">
              <MdPieChart className="text-primary h-5 w-5" /> Revenue splits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold text-muted-foreground">Revenue Splits</h4>
                <div className="space-y-2 text-xs">
                  {(() => {
                    const totalCharges = finance.breakdown.rooms + finance.breakdown.food + finance.breakdown.additional + (finance.breakdown.walkIn || 0);
                    return (
                      <>
                        <div>
                          <div className="flex justify-between font-semibold mb-1"><span>Room Lodgings</span><span>${finance.breakdown.rooms.toFixed(2)}</span></div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden"><div className="bg-primary h-full rounded-full" style={{ width: `${totalCharges > 0 ? (finance.breakdown.rooms / totalCharges) * 100 : 0}%` }} /></div>
                        </div>
                        <div>
                          <div className="flex justify-between font-semibold mb-1"><span>Room Food Orders</span><span>${finance.breakdown.food.toFixed(2)}</span></div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden"><div className="bg-purple-500 h-full rounded-full" style={{ width: `${totalCharges > 0 ? (finance.breakdown.food / totalCharges) * 100 : 0}%` }} /></div>
                        </div>
                        <div>
                          <div className="flex justify-between font-semibold mb-1"><span>Walk-in POS Sales</span><span>${(finance.breakdown.walkIn || 0).toFixed(2)}</span></div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full rounded-full" style={{ width: `${totalCharges > 0 ? ((finance.breakdown.walkIn || 0) / totalCharges) * 100 : 0}%` }} /></div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCheckins = () => {
    const checkedIn = bookings.filter(b => b.status === "Checked In" || b.status === "Checked Out");
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-6 border-b border-border print:hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2"><MdAssignment className="text-primary" /> Check-ins Report</h3>
          <p className="text-sm text-muted-foreground">Log of all historical check-ins.</p>
        </div>
        <PrintHeader title="Check-ins Report" />
        <table className="w-full text-sm text-left print:text-xs">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border print:bg-slate-100 print:text-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Guest</th>
              <th className="px-6 py-4 font-semibold">Rooms</th>
              <th className="px-6 py-4 font-semibold">Check-in Date</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {checkedIn.map(b => (
              <tr key={b._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">{b.guestId?.firstName} {b.guestId?.lastName}</td>
                <td className="px-6 py-4">{b.roomIds?.map((r: any) => r.roomNumber).join(", ")}</td>
                <td className="px-6 py-4">{formatDate(b.checkInDate)}</td>
                <td className="px-6 py-4 font-bold">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCheckouts = () => {
    const checkedOut = bookings.filter(b => b.status === "Checked Out");
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-6 border-b border-border print:hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2"><MdLogout className="text-rose-500" /> Check-outs Report</h3>
          <p className="text-sm text-muted-foreground">Log of all finalized check-outs and billing.</p>
        </div>
        <PrintHeader title="Check-outs Report" />
        <table className="w-full text-sm text-left print:text-xs">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border print:bg-slate-100 print:text-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Guest</th>
              <th className="px-6 py-4 font-semibold">Rooms</th>
              <th className="px-6 py-4 font-semibold">Check-out Date</th>
              <th className="px-6 py-4 font-semibold text-right">Total Billed</th>
            </tr>
          </thead>
          <tbody>
            {checkedOut.map(b => (
              <tr key={b._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">{b.guestId?.firstName} {b.guestId?.lastName}</td>
                <td className="px-6 py-4">{b.roomIds?.map((r: any) => r.roomNumber).join(", ")}</td>
                <td className="px-6 py-4">{formatDate(b.checkOutDate)}</td>
                <td className="px-6 py-4 font-bold text-right">${b.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderGuests = () => {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-6 border-b border-border print:hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2"><MdPeople className="text-blue-500" /> Guest Directory Report</h3>
          <p className="text-sm text-muted-foreground">Master list of all registered guests.</p>
        </div>
        <PrintHeader title="Guest Directory Report" />
        <table className="w-full text-sm text-left print:text-xs">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border print:bg-slate-100 print:text-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Contact</th>
              <th className="px-6 py-4 font-semibold">ID/Passport</th>
              <th className="px-6 py-4 font-semibold text-right">Visits</th>
            </tr>
          </thead>
          <tbody>
            {guests.map(g => (
              <tr key={g._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">{g.firstName} {g.lastName}</td>
                <td className="px-6 py-4">{g.phone}<br/><span className="text-xs text-muted-foreground">{g.email}</span></td>
                <td className="px-6 py-4">{g.idPassportNumber}</td>
                <td className="px-6 py-4 font-bold text-right">{g.visitCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderExpenses = () => {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-6 border-b border-border print:hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2"><MdAttachMoney className="text-amber-500" /> Daily Expenses Report</h3>
          <p className="text-sm text-muted-foreground">Log of all recorded hotel expenses.</p>
        </div>
        <PrintHeader title="Daily Expenses Report" />
        <table className="w-full text-sm text-left print:text-xs">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border print:bg-slate-100 print:text-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Description</th>
              <th className="px-6 py-4 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(e.date)}</td>
                <td className="px-6 py-4 font-semibold">{e.category}</td>
                <td className="px-6 py-4">{e.description}</td>
                <td className="px-6 py-4 font-bold text-right text-rose-600">${e.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderFoodSales = () => {
    const foodCharges = charges.filter(c => c.chargeType === "Food");
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-6 border-b border-border print:hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2"><MdRestaurantMenu className="text-purple-500" /> Room Food Sales</h3>
          <p className="text-sm text-muted-foreground">Log of all food items sold and billed to guest room folios.</p>
        </div>
        <PrintHeader title="Room Food Sales Report" />
        <table className="w-full text-sm text-left print:text-xs">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border print:bg-slate-100 print:text-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Item Description</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {foodCharges.map(c => (
              <tr key={c._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                <td className="px-6 py-4 font-medium">{c.description}</td>
                <td className="px-6 py-4 text-xs font-bold">{c.status}</td>
                <td className="px-6 py-4 font-bold text-right text-emerald-600">${c.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderWalkInSales = () => {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-6 border-b border-border print:hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2"><MdRestaurantMenu className="text-indigo-500" /> Walk-in POS Sales</h3>
          <p className="text-sm text-muted-foreground">Log of all food items sold to walk-in customers.</p>
        </div>
        <PrintHeader title="Walk-in POS Sales Report" />
        <table className="w-full text-sm text-left print:text-xs">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border print:bg-slate-100 print:text-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Item Name</th>
              <th className="px-6 py-4 font-semibold text-center">Qty</th>
              <th className="px-6 py-4 font-semibold text-right">Total Price</th>
            </tr>
          </thead>
          <tbody>
            {walkInItems?.map((item: any) => (
              <tr key={item._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                <td className="px-6 py-4 font-medium">{item.itemName}</td>
                <td className="px-6 py-4 font-bold text-center">{item.quantity}</td>
                <td className="px-6 py-4 font-bold text-right text-emerald-600">${item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
            {(!walkInItems || walkInItems.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No walk-in sales recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAdditionalCharges = () => {
    const addCharges = charges.filter(c => !["Food", "Room Charge"].includes(c.chargeType));
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-6 border-b border-border print:hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2"><MdAddCircle className="text-indigo-500" /> Additional Charges</h3>
          <p className="text-sm text-muted-foreground">Log of all extra amenities and penalties billed to guests.</p>
        </div>
        <PrintHeader title="Additional Charges Report" />
        <table className="w-full text-sm text-left print:text-xs">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border print:bg-slate-100 print:text-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold">Description</th>
              <th className="px-6 py-4 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {addCharges.map(c => (
              <tr key={c._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                <td className="px-6 py-4 font-semibold text-indigo-600">{c.chargeType}</td>
                <td className="px-6 py-4 font-medium">{c.description}</td>
                <td className="px-6 py-4 font-bold text-right">${c.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPayments = () => {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-6 border-b border-border print:hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2"><MdPayment className="text-emerald-500" /> Payments Ledger</h3>
          <p className="text-sm text-muted-foreground">Master list of all payments received.</p>
        </div>
        <PrintHeader title="Payments Ledger Report" />
        <table className="w-full text-sm text-left print:text-xs">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border print:bg-slate-100 print:text-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Method</th>
              <th className="px-6 py-4 font-semibold">Notes/Reference</th>
              <th className="px-6 py-4 font-semibold text-right">Amount Received</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(p.createdAt || p.date)}</td>
                <td className="px-6 py-4 font-semibold">{p.paymentMethod}</td>
                <td className="px-6 py-4 text-muted-foreground">{p.notes || "-"}</td>
                <td className="px-6 py-4 font-black text-right text-emerald-600">${p.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInvoices = () => {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-6 border-b border-border print:hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2"><MdReceipt className="text-slate-700" /> Invoices Log</h3>
          <p className="text-sm text-muted-foreground">List of all generated final invoices.</p>
        </div>
        <PrintHeader title="Invoices History Report" />
        <table className="w-full text-sm text-left print:text-xs">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border print:bg-slate-100 print:text-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Issue Date</th>
              <th className="px-6 py-4 font-semibold">Invoice No</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(i.invoiceDate || i.createdAt)}</td>
                <td className="px-6 py-4 font-mono font-semibold">{i.invoiceNumber}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${i.balanceDue <= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                    {i.balanceDue <= 0 ? "Paid" : "Due"}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-right">${i.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInventory = () => {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-6 border-b border-border print:hidden">
          <h3 className="font-semibold text-lg flex items-center gap-2"><MdInventory className="text-teal-500" /> Inventory & Stock</h3>
          <p className="text-sm text-muted-foreground">Current status of menu items and stock levels.</p>
        </div>
        <PrintHeader title="Inventory Stock Report" />
        <table className="w-full text-sm text-left print:text-xs">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border print:bg-slate-100 print:text-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Item Name</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Price</th>
              <th className="px-6 py-4 font-semibold text-right">Current Stock</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map(m => (
              <tr key={m._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 font-semibold">{m.itemName}</td>
                <td className="px-6 py-4">{m.category}</td>
                <td className="px-6 py-4">${m.price.toFixed(2)}</td>
                <td className="px-6 py-4 font-black text-right">
                  <span className={`${m.stockQuantity < 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {m.stockQuantity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:m-0 print:p-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          main { background-color: white !important; padding: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border-bottom: 1px solid #e2e8f0 !important; padding: 12px 8px !important; }
          th { background-color: #f8fafc !important; color: #475569 !important; font-weight: 700 !important; }
          tr:nth-child(even) { background-color: #f8fafc !important; }
        }
      `}} />
      
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports Central</h2>
          <p className="text-muted-foreground mt-1 text-sm">View analytics, histories, and download PDF reports.</p>
        </div>
        <div className="flex gap-2">
          {activeTab !== "Overview" && (
            <Button variant="default" onClick={handlePrint} className="rounded-xl font-bold shadow-lg h-10 px-6">
              <MdPrint className="mr-2 h-5 w-5" /> Export PDF
            </Button>
          )}
          <Button variant="outline" onClick={fetchAllData} className="rounded-xl h-10 w-10 p-0">
            <MdRefresh className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tabs - Hidden when printing */}
      <div className="flex space-x-1 bg-muted p-1 rounded-xl w-full overflow-x-auto print:hidden shadow-sm border border-border pb-1">
        {[
          "Overview", "Check-ins", "Check-outs", "Guests", 
          "Payments", "Invoices", "Expenses", "Food Sales", "Walk-in Sales",
          "Additional Charges", "Inventory"
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="print:block">
        {activeTab === "Overview" && renderOverview()}
        {activeTab === "Check-ins" && renderCheckins()}
        {activeTab === "Check-outs" && renderCheckouts()}
        {activeTab === "Guests" && renderGuests()}
        {activeTab === "Payments" && renderPayments()}
        {activeTab === "Invoices" && renderInvoices()}
        {activeTab === "Expenses" && renderExpenses()}
        {activeTab === "Food Sales" && renderFoodSales()}
        {activeTab === "Walk-in Sales" && renderWalkInSales()}
        {activeTab === "Additional Charges" && renderAdditionalCharges()}
        {activeTab === "Inventory" && renderInventory()}
      </div>
    </div>
  );
}
