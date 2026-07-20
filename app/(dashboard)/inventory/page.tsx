"use client";

import { useState, useEffect } from "react";
import { MdAdd, MdRemove, MdHistory, MdInventory, MdWarning } from "react-icons/md";
import { Button } from "@/components/ui/button";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionType, setActionType] = useState<"in"|"out">("in");
  const [quantity, setQuantity] = useState<string>("1");
  const [reason, setReason] = useState<string>("purchase"); // purchase, sale, adjustment
  
  const [processing, setProcessing] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        setMovements(data.movements || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAction = (item: any, type: "in"|"out") => {
    setSelectedItem(item);
    setActionType(type);
    setQuantity("1");
    setReason(type === "in" ? "purchase" : "adjustment");
    setIsModalOpen(true);
  };

  const submitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !quantity) return;
    
    setProcessing(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedItem._id,
          type: actionType,
          quantity: parseInt(quantity),
          reason
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchInventory(); // Refresh data
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update stock");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock Management</h2>
          <p className="text-muted-foreground mt-1 text-sm">Track inventory levels and manage stock movements.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Inventory Table */}
        <div className="lg:col-span-2 bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b bg-muted/20 flex justify-between items-center">
            <h3 className="font-semibold text-lg flex items-center gap-2"><MdInventory className="text-primary"/> Current Stock</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold">Item Name</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Stock Lvl</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No inventory items found. Add items in Menu/POS.</td></tr>
                ) : items.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {item.itemName}
                      {item.stockQuantity <= 10 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                          <MdWarning /> LOW
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{item.category}</td>
                    <td className="px-6 py-4">
                      <span className={`font-black text-base ${item.stockQuantity <= 10 ? "text-rose-600" : "text-foreground"}`}>
                        {item.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-8 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700" onClick={() => handleAction(item, "in")}>
                          <MdAdd className="mr-1 h-4 w-4" /> In
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700" onClick={() => handleAction(item, "out")}>
                          <MdRemove className="mr-1 h-4 w-4" /> Out
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Movements Log */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-5 border-b bg-muted/20 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-lg flex items-center gap-2"><MdHistory className="text-muted-foreground"/> Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {loading ? (
              <div className="text-center text-muted-foreground text-sm">Loading history...</div>
            ) : movements.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm">No recent movements.</div>
            ) : movements.map((mov) => (
              <div key={mov._id} className="flex items-start gap-4 p-3 rounded-xl border bg-muted/5">
                <div className={`p-2 rounded-lg ${mov.type === 'in' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                  {mov.type === 'in' ? <MdAdd className="h-4 w-4" /> : <MdRemove className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {mov.type === 'in' ? '+' : '-'}{mov.quantity} {mov.productId?.itemName || "Unknown Item"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
                    <span className="capitalize">{mov.reason}</span>
                    <span className="opacity-70">{new Date(mov.date).toLocaleDateString()} {new Date(mov.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg text-white ${actionType === 'in' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {actionType === 'in' ? <MdAdd /> : <MdRemove />}
                  </span>
                  Stock {actionType === 'in' ? 'In' : 'Out'} - {selectedItem?.itemName}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted/50 transition-colors">
                  <MdRemove className="rotate-45" /> {/* Simple close X icon using MdRemove rotated */}
                </button>
              </div>
              <form onSubmit={submitMovement} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Quantity</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full h-12 rounded-lg border border-input bg-transparent px-3 text-lg font-bold focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Reason</label>
                  <select 
                    className="w-full h-12 rounded-lg border border-input bg-transparent px-3 text-sm focus:ring-1 focus:ring-primary"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  >
                    {actionType === "in" ? (
                      <>
                        <option value="purchase">Purchase</option>
                        <option value="adjustment">Adjustment (Found/Audit)</option>
                      </>
                    ) : (
                      <>
                        <option value="sale">Manual Sale/Usage</option>
                        <option value="adjustment">Spoilage/Damage</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="h-12 flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={processing} className={`h-12 flex-1 text-base font-bold text-white ${actionType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                    {processing ? "..." : `Confirm`}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
