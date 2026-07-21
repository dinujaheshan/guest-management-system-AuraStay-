import { 
  MdMeetingRoom, 
  MdCheckCircle, 
  MdEventSeat, 
  MdAttachMoney,
  MdTrendingUp,
  MdPeople
} from "react-icons/md"
import connectToDatabase from "@/lib/db";
import { Room } from "@/models/Room";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";
import { Booking } from "@/models/Booking";
import { RevenueChart, ActivityChart } from "./DashboardCharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export default async function DashboardPage() {
  await connectToDatabase();

  const totalRooms = await Room.countDocuments();
  const availableRooms = await Room.countDocuments({ status: "Available" });
  const reservedRooms = await Room.countDocuments({ status: "Reserved" });
  const occupiedRooms = await Room.countDocuments({ status: "Occupied" });
  
  const totalUsers = await User.countDocuments();

  const occupancyRate = totalRooms === 0 ? 0 : Math.round(((occupiedRooms + reservedRooms) / totalRooms) * 100);

  // --- Calculate Chart Data ---
  const today = new Date();
  
  // 1. Revenue Last 7 Days
  const revenueData = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const start = startOfDay(d);
    const end = endOfDay(d);
    const dailyPayments = await Payment.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    revenueData.push({
      date: format(d, "MMM dd"),
      revenue: dailyPayments.length > 0 ? dailyPayments[0].total : 0
    });
  }

  // 2. Today's Activity
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);
  
  const checkInsToday = await Booking.countDocuments({
    checkInDate: { $gte: startToday, $lte: endToday }
  });
  
  const checkOutsToday = await Booking.countDocuments({
    checkOutDate: { $gte: startToday, $lte: endToday }
  });
  
  const activityData = [
    { name: "Check-Ins", value: checkInsToday },
    { name: "Check-Outs", value: checkOutsToday }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground mt-1 text-sm">Monitor your guest house operations and performance metrics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Rooms" 
          value={totalRooms.toString()} 
          icon={MdMeetingRoom} 
          trend="Total Inventory" 
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <StatCard 
          title="Available Rooms" 
          value={availableRooms.toString()} 
          icon={MdCheckCircle} 
          trend={`${occupancyRate}% Occupancy Rate`} 
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <StatCard 
          title="Reserved Rooms" 
          value={reservedRooms.toString()} 
          icon={MdEventSeat} 
          trend="Checking in soon" 
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <StatCard 
          title="Total Users" 
          value={totalUsers.toString()} 
          icon={MdPeople} 
          trend="Registered Staff" 
          color="text-purple-500"
          bg="bg-purple-500/10"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Revenue Analytics</h3>
            <div className="p-2 bg-muted rounded-md"><MdTrendingUp className="text-muted-foreground"/></div>
          </div>
          <div className="flex h-[320px] items-center justify-center rounded-xl bg-background mt-4 p-2 pb-6">
            <RevenueChart data={revenueData} />
          </div>
        </div>
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Today's Activity</h3>
          </div>
          <div className="flex-1 flex h-[320px] items-center justify-center rounded-xl bg-background mt-4 p-2 pb-6">
            <ActivityChart data={activityData} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend, color, bg }: any) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
      <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-transparent to-muted/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground tracking-tight">{title}</h3>
        <div className={`p-2.5 rounded-xl ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <div className="mt-5">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-2 font-medium">{trend}</p>
      </div>
    </div>
  )
}
