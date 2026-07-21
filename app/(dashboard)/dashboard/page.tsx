"use client";

import { useState, useEffect } from "react";
import { 
  MdMeetingRoom, 
  MdCheckCircle, 
  MdEventSeat, 
  MdAttachMoney,
  MdTrendingUp,
  MdWarning,
  MdInfo
} from "react-icons/md"
import { motion } from "framer-motion"
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch("/api/dashboard/insights");
        const data = await res.json();
        setInsights(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchInsights();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Smart Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-sm">Predictive analytics and operational overview.</p>
        </div>
      </motion.div>

      {/* Smart Alert Box */}
      {insights && insights.occupancy && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-5 rounded-2xl border shadow-sm flex items-start gap-4 ${
            insights.occupancy.predictedRate < 30 ? "bg-rose-500/10 border-rose-500/20 text-rose-700" 
            : insights.occupancy.predictedRate > 80 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700" 
            : "bg-blue-500/10 border-blue-500/20 text-blue-700"
          }`}
        >
          <div className="mt-0.5">
            {insights.occupancy.predictedRate < 30 ? <MdWarning className="h-6 w-6" /> : <MdInfo className="h-6 w-6" />}
          </div>
          <div>
            <h4 className="font-bold text-lg">AI Assistant Insight</h4>
            <p className="text-sm mt-1 opacity-90">{insights.occupancy.smartAlert}</p>
          </div>
        </motion.div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard 
          title="Total Revenue (30 Days)" 
          value={loading ? "..." : `$${insights?.revenue?.current30Days?.toLocaleString() || 0}`} 
          icon={MdAttachMoney} 
          trend={loading ? "..." : `${insights?.revenue?.trendPercentage > 0 ? "+" : ""}${insights?.revenue?.trendPercentage}% from previous 30 days`} 
          color="text-primary"
          bg="bg-primary/10"
          variants={itemVariants}
        />
        <StatCard 
          title="Predicted Occupancy (7 Days)" 
          value={loading ? "..." : `${insights?.occupancy?.predictedRate || 0}%`} 
          icon={MdCheckCircle} 
          trend="Next 7 days forecast" 
          color="text-emerald-500"
          bg="bg-emerald-500/10"
          variants={itemVariants}
        />
        <StatCard 
          title="Expected Check-ins Today" 
          value={loading ? "..." : (insights?.today?.checkIns || 0)} 
          icon={MdEventSeat} 
          trend="Pending arrivals" 
          color="text-amber-500"
          bg="bg-amber-500/10"
          variants={itemVariants}
        />
        <StatCard 
          title="Expected Check-outs Today" 
          value={loading ? "..." : (insights?.today?.checkOuts || 0)} 
          icon={MdMeetingRoom} 
          trend="Pending departures" 
          color="text-rose-500"
          bg="bg-rose-500/10"
          variants={itemVariants}
        />
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-7"
      >
        <motion.div variants={itemVariants} className="lg:col-span-4 bg-card/60 backdrop-blur-xl rounded-3xl border border-white/5 shadow-xl p-7 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="font-semibold text-lg">Revenue Trend Analysis</h3>
            <div className="p-2.5 bg-muted/80 rounded-xl"><MdTrendingUp className="text-muted-foreground"/></div>
          </div>
          <div className="flex flex-col h-[280px] items-center justify-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/5 text-muted-foreground relative z-10">
            <div className="text-4xl font-black mb-2">${insights?.revenue?.current30Days?.toLocaleString() || 0}</div>
            <p className="text-sm">Revenue generated in the last 30 days.</p>
            <div className="mt-4 flex gap-4">
               <div className="bg-background px-4 py-2 rounded-xl text-xs font-bold shadow-sm border border-border">
                  Previous 30 Days: ${insights?.revenue?.past30Days?.toLocaleString() || 0}
               </div>
               <div className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm border border-border ${insights?.revenue?.trendPercentage >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                  Trend: {insights?.revenue?.trendPercentage >= 0 ? "+" : ""}{insights?.revenue?.trendPercentage}%
               </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-3 bg-card/60 backdrop-blur-xl rounded-3xl border border-white/5 shadow-xl p-7 flex flex-col relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="font-semibold text-lg">Quick Actions</h3>
          </div>
          <div className="flex-1 flex flex-col gap-4 relative z-10">
            <Link href="/calendar">
              <Button className="w-full h-14 rounded-xl text-base justify-start px-6 font-bold" variant="outline">
                <MdCheckCircle className="mr-3 h-5 w-5 text-primary" />
                View Smart Calendar
              </Button>
            </Link>
            <Link href="/checkin">
              <Button className="w-full h-14 rounded-xl text-base justify-start px-6 font-bold" variant="outline">
                <MdEventSeat className="mr-3 h-5 w-5 text-amber-500" />
                Process Today's Check-ins ({insights?.today?.checkIns || 0})
              </Button>
            </Link>
            <Link href="/checkout">
              <Button className="w-full h-14 rounded-xl text-base justify-start px-6 font-bold" variant="outline">
                <MdMeetingRoom className="mr-3 h-5 w-5 text-rose-500" />
                Process Today's Check-outs ({insights?.today?.checkOuts || 0})
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend, color, bg, variants }: any) {
  return (
    <motion.div variants={variants} className="bg-card/80 backdrop-blur-lg rounded-3xl border border-white/5 shadow-lg p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/10 relative overflow-hidden group cursor-pointer">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-transparent to-muted/50 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500 -z-10" />
      
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground tracking-tight">{title}</h3>
        <div className={`p-3 rounded-2xl ${bg} ring-1 ring-inset ring-white/5`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <div className="mt-5">
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-50" />
          {trend}
        </p>
      </div>
    </motion.div>
  )
}
