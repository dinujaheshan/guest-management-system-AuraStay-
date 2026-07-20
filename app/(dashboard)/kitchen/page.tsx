"use client";

import { useState, useEffect } from "react";
import { MdOutlineSoupKitchen, MdCheckCircle, MdTimer, MdRefresh } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kitchen/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const markAsServed = async (id: string) => {
    try {
      const res = await fetch(`/api/kitchen/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "served" }),
      });
      if (res.ok) {
        fetchOrders(); // Refresh
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingOrders = orders.filter(o => o.status === "pending");
  const servedOrders = orders.filter(o => o.status === "served");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <MdOutlineSoupKitchen className="text-amber-500 w-8 h-8" />
            Kitchen Order Tickets (KOT)
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Live display of incoming food orders from POS.</p>
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={loading} className="rounded-xl shadow-sm h-11 px-4">
          <MdRefresh className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Orders Column */}
        <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[500px]">
          <h3 className="font-extrabold text-lg flex items-center gap-2 mb-6">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
            Pending Orders ({pendingOrders.length})
          </h3>

          <div className="flex flex-col gap-4">
            {pendingOrders.map(order => (
              <div key={order._id} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Order ID: {order._id.slice(-6)}</span>
                    <h4 className="font-black text-xl text-slate-900 dark:text-white mt-1">{order.itemName}</h4>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-950/50 text-amber-600 font-black text-xl px-4 py-2 rounded-xl">
                    x {order.quantity}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <MdTimer className="w-4 h-4" />
                      {formatDistanceToNow(new Date(order.createdAt))} ago
                    </div>
                    {order.roomId && (
                      <div className="text-xs font-black text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-lg border border-teal-100 dark:border-teal-900">
                        Room {order.roomId.roomNumber}
                      </div>
                    )}
                  </div>
                  <Button onClick={() => markAsServed(order._id)} className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-md">
                    <MdCheckCircle className="w-5 h-5 mr-2" />
                    Mark as Served
                  </Button>
                </div>
              </div>
            ))}

            {pendingOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <MdOutlineSoupKitchen className="w-16 h-16 opacity-20 mb-4" />
                <p className="font-semibold text-sm">No pending orders. Kitchen is all clear!</p>
              </div>
            )}
          </div>
        </div>

        {/* Served Orders Column */}
        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[500px]">
          <h3 className="font-extrabold text-lg flex items-center gap-2 mb-6 opacity-75">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            Recently Served ({servedOrders.length})
          </h3>

          <div className="flex flex-col gap-4">
            {servedOrders.map(order => (
              <div key={order._id} className="bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex justify-between items-center opacity-80 hover:opacity-100 transition-opacity">
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">
                    {order.quantity}x {order.itemName}
                  </h4>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    Served {formatDistanceToNow(new Date(order.updatedAt))} ago {order.roomId ? `to Room ${order.roomId.roomNumber}` : ''}
                  </p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 p-2 rounded-full">
                  <MdCheckCircle className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
