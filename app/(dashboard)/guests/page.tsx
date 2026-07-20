"use client";

import { useState, useEffect } from "react";
import { MdPeople, MdAdd, MdDelete, MdEdit, MdRefresh, MdSearch } from "react-icons/md";
import { Button } from "@/components/ui/button";

const initialFormData = {
  firstName: "",
  lastName: "",
  idPassportNumber: "",
  phone: "",
  email: "",
  address: ""
};

export default function GuestsPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredGuests = guests.filter(g => {
    const matchesSearch = `${g.firstName} ${g.lastName} ${g.idPassportNumber} ${g.phone} ${g.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    if (statusFilter === "All") return matchesSearch;
    return matchesSearch && g.currentStatus === statusFilter;
  });
  const fetchGuests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guests");
      const data = await res.json();
      setGuests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/guests/${editingId}` : "/api/guests";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        fetchGuests();
        setFormData(initialFormData);
      } else {
        const error = await res.json();
        alert(error.error || `Failed to ${editingId ? "update" : "add"} guest`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (guest: any) => {
    setEditingId(guest._id);
    setFormData({
      firstName: guest.firstName,
      lastName: guest.lastName,
      idPassportNumber: guest.idPassportNumber,
      phone: guest.phone,
      email: guest.email || "",
      address: guest.address || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this guest?")) return;
    try {
      const res = await fetch(`/api/guests/${id}`, { method: "DELETE" });
      if (res.ok) fetchGuests();
      else {
        const error = await res.json();
        alert(error.error || "Failed to delete");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Guest Management</h2>
          <p className="text-muted-foreground mt-1 text-sm">View and manage guest profiles and history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchGuests} disabled={loading} className="rounded-xl">
            <MdRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => showForm ? cancelForm() : setShowForm(true)} className="rounded-xl shadow-md">
            {showForm ? "Cancel" : <><MdAdd className="mr-2 h-5 w-5" /> Add Guest</>}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">{editingId ? "Edit Guest" : "Add New Guest"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">First Name</label>
              <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="John" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Last Name</label>
              <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="Doe" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ID / Passport Number</label>
              <input required value={formData.idPassportNumber} onChange={e => setFormData({...formData, idPassportNumber: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="e.g. AB1234567" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number</label>
              <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="+1 234 567 8900" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="john@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Address</label>
              <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="123 Main St" />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-2">
              <Button type="submit" className="w-full md:w-auto h-[42px] px-8 rounded-xl shadow-md">
                {editingId ? "Update Guest" : "Save Guest"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input 
            type="text" 
            placeholder="Search guests by name, ID, phone, or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium min-w-[150px]"
        >
          <option value="All">All Guests</option>
          <option value="Checked In">Currently Staying</option>
          <option value="Checked Out">Checked Out</option>
        </select>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">Loading guests...</div>
        ) : filteredGuests.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
            <MdPeople className="h-10 w-10 opacity-20 mb-2" />
            <p>{guests.length === 0 ? "No guests found. Add one to get started!" : "No guests match your search."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">ID/Passport</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">Visits</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {guest.firstName} {guest.lastName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        guest.currentStatus === "Checked In" ? "bg-amber-500/10 text-amber-600" : "bg-slate-500/10 text-slate-500"
                      }`}>
                        {guest.currentStatus || "Checked Out"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{guest.idPassportNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span>{guest.phone}</span>
                        <span className="text-xs text-muted-foreground">{guest.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                        {guest.visitCount} Stays
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(guest)} className="h-8 w-8 mr-1 text-muted-foreground hover:text-primary">
                        <MdEdit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(guest._id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <MdDelete className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
