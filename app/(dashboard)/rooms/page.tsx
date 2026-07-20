"use client";

import { useState, useEffect } from "react";
import { MdMeetingRoom, MdAdd, MdDelete, MdEdit, MdRefresh, MdSearch } from "react-icons/md";
import { Button } from "@/components/ui/button";

const initialFormData = {
  roomNumber: "",
  roomType: "Standard",
  category: "AC",
  floor: "1st",
  capacity: 2,
  pricePerNight: 100,
  status: "Available"
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [roomSearchQuery, setRoomSearchQuery] = useState("");

  const filteredRooms = rooms.filter(r => 
    `${r.roomNumber} ${r.roomType} ${r.category} ${r.status}`
      .toLowerCase()
      .includes(roomSearchQuery.toLowerCase())
  );
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const [roomsRes, typesRes, catsRes, floorsRes] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/room-types"),
        fetch("/api/room-categories"),
        fetch("/api/floors")
      ]);
      
      const roomsData = await roomsRes.json();
      const typesData = await typesRes.json();
      const catsData = await catsRes.json();
      const floorsData = await floorsRes.json();

      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setRoomTypes(Array.isArray(typesData) ? typesData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setFloors(Array.isArray(floorsData) ? floorsData : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/rooms/${editingId}` : "/api/rooms";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, capacity: Number(formData.capacity), pricePerNight: Number(formData.pricePerNight) }),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        fetchRooms();
        setFormData(initialFormData);
      } else {
        const error = await res.json();
        alert(error.error || `Failed to ${editingId ? "update" : "create"} room`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (room: any) => {
    setEditingId(room._id);
    setFormData({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      category: room.category,
      floor: room.floor,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      status: room.status || "Available"
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
      if (res.ok) fetchRooms();
      else alert("Failed to delete (You might need Admin role)");
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
          <h2 className="text-3xl font-bold tracking-tight">Rooms Management</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage your property's room inventory and status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRooms} disabled={loading} className="rounded-xl">
            <MdRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => showForm ? cancelForm() : setShowForm(true)} className="rounded-xl shadow-md">
            {showForm ? "Cancel" : <><MdAdd className="mr-2 h-5 w-5" /> Add New Room</>}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">{editingId ? "Edit Room" : "Add New Room"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Room Number</label>
              <input required value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="e.g. 101" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <select value={formData.roomType} onChange={e => setFormData({...formData, roomType: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md">
                {roomTypes.length > 0 ? roomTypes.map(t => <option key={t._id} value={t.name}>{t.name}</option>) : (
                  <>
                    <option>Standard</option>
                    <option>Deluxe</option>
                    <option>Family</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md">
                {categories.length > 0 ? categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>) : (
                  <>
                    <option>AC</option>
                    <option>Non-AC</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Floor</label>
              <select value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md">
                {floors.length > 0 ? floors.map(f => <option key={f._id} value={f.name}>{f.name}</option>) : (
                  <>
                    <option>1st Floor</option>
                    <option>2nd Floor</option>
                    <option>3rd Floor</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Capacity</label>
              <input type="number" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" min="1" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Price Per Night ($)</label>
              <input type="number" required value={formData.pricePerNight} onChange={e => setFormData({...formData, pricePerNight: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" min="0" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md">
                <option>Available</option>
                <option>Reserved</option>
                <option>Occupied</option>
                <option>Cleaning</option>
                <option>Maintenance</option>
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-1 flex items-end">
              <Button type="submit" className="w-full md:w-auto h-[42px] px-8 rounded-xl shadow-md">
                {editingId ? "Update Room" : "Save Room"}
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
            placeholder="Search rooms by number, type, category, or status..." 
            value={roomSearchQuery}
            onChange={(e) => setRoomSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">Loading rooms...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
            <MdMeetingRoom className="h-10 w-10 opacity-20 mb-2" />
            <p>{rooms.length === 0 ? "No rooms found. Add one to get started!" : "No rooms match your search."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Room No</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Capacity</th>
                  <th className="px-6 py-4 font-semibold">Price</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => (
                  <tr key={room._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{room.roomNumber}</td>
                    <td className="px-6 py-4">{room.roomType}</td>
                    <td className="px-6 py-4">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">{room.category}</span>
                    </td>
                    <td className="px-6 py-4">{room.capacity} Guests</td>
                    <td className="px-6 py-4 font-medium text-primary">${room.pricePerNight}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        room.status === 'Available' ? 'bg-emerald-500/10 text-emerald-600' :
                        room.status === 'Occupied' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(room)} className="h-8 w-8 mr-1 text-muted-foreground hover:text-primary">
                        <MdEdit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(room._id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
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
