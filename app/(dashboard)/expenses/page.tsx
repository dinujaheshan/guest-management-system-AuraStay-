"use client";

import { useState, useEffect } from "react";
import { MdMonetizationOn, MdRefresh, MdAdd, MdClose } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Expense State
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("Utility");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          category,
          description,
          date: new Date(date)
        }),
      });

      if (res.ok) {
        alert("Expense recorded successfully!");
        setShowAddForm(false);
        setAmount(0);
        setDescription("");
        fetchExpenses();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add expense");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage daily operational and maintenance expenses.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddForm(true)} className="rounded-xl font-bold border-primary text-primary">
            <MdAdd className="mr-1 h-5 w-5" /> Add Expense
          </Button>
          <Button variant="outline" onClick={fetchExpenses} className="rounded-xl">
            <MdRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">Loading expenses...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold">{format(new Date(exp.date), "MMM dd, yyyy")}</td>
                    <td className="px-6 py-4">
                      <span className="bg-rose-500/10 text-rose-600 px-2 py-1 rounded text-xs font-semibold">{exp.category}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{exp.description}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">${exp.amount.toFixed(2)}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No expenses recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MdMonetizationOn className="text-rose-600 h-5 w-5" /> Record Expense
              </h3>
              <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-muted rounded-lg text-muted-foreground">
                <MdClose className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Amount ($) *</label>
                <input 
                  type="number" 
                  required 
                  min="0.01" 
                  step="0.01"
                  value={amount} 
                  onChange={e => setAmount(Number(e.target.value))} 
                  className="w-full p-2.5 border border-input bg-background rounded-xl text-lg font-bold" 
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Category *</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full p-2.5 border border-input bg-background rounded-xl"
                >
                  <option>Utility</option>
                  <option>Salary</option>
                  <option>Maintenance</option>
                  <option>Food Supplies</option>
                  <option>Marketing</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Date *</label>
                <input 
                  type="date" 
                  required
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full p-2.5 border border-input bg-background rounded-xl" 
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Description</label>
                <textarea 
                  required
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="e.g. Electricity Bill for July"
                  className="w-full p-2.5 border border-input bg-background rounded-xl h-24 resize-none" 
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full rounded-xl h-12 font-bold text-base shadow-md bg-rose-600 hover:bg-rose-700 text-white">
                  Record Expense
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
