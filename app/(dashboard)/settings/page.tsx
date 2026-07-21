"use client";

import { useState, useEffect } from "react";
import { 
  MdSettings, 
  MdAdd, 
  MdRefresh, 
  MdEdit, 
  MdDelete, 
  MdLayers, 
  MdRoomPreferences, 
  MdCategory, 
  MdCardGiftcard 
} from "react-icons/md";
import { Button } from "@/components/ui/button";

const initialPackageForm = {
  packageName: "",
  description: "",
  roomType: "Standard",
  category: "AC",
  pricePerNight: 80,
  includedServices: "Free Breakfast, High-Speed WiFi",
  status: "Active",
};

const initialFloorForm = { name: "", description: "" };
const initialTypeForm = { name: "", capacity: 2, defaultPrice: 100 };
const initialCategoryForm = { name: "", description: "" };

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"packages" | "floors" | "types" | "categories" | "business" | "system">("packages");
  const [loading, setLoading] = useState(true);

  // Data states
  const [packages, setPackages] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [businessSettings, setBusinessSettings] = useState<any>({});
  const [systemSettings, setSystemSettings] = useState<any>({});

  const [uploadingLogo, setUploadingLogo] = useState(false);

  // CRUD Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Specific Forms
  const [packageForm, setPackageForm] = useState(initialPackageForm);
  const [floorForm, setFloorForm] = useState(initialFloorForm);
  const [typeForm, setTypeForm] = useState(initialTypeForm);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pkgRes, flRes, tyRes, catRes, busRes, sysRes] = await Promise.all([
        fetch("/api/room-packages"),
        fetch("/api/floors"),
        fetch("/api/room-types"),
        fetch("/api/room-categories"),
        fetch("/api/settings/business"),
        fetch("/api/settings/system"),
      ]);

      const pkgData = await pkgRes.json();
      const flData = await flRes.json();
      const tyData = await tyRes.json();
      const catData = await catRes.json();
      const busData = await busRes.json();
      const sysData = await sysRes.json();

      setPackages(Array.isArray(pkgData) ? pkgData : []);
      setFloors(Array.isArray(flData) ? flData : []);
      setTypes(Array.isArray(tyData) ? tyData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setBusinessSettings(busData || {});
      setSystemSettings(sysData || {});
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.packageName) return alert("Please enter package name");

    const servicesArray = packageForm.includedServices
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const body = {
      ...packageForm,
      pricePerNight: Number(packageForm.pricePerNight),
      includedServices: servicesArray,
    };

    try {
      const url = editingId ? `/api/room-packages/${editingId}` : "/api/room-packages";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setPackageForm(initialPackageForm);
        fetchData();
      } else {
        alert("Failed to save room package");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floorForm.name) return alert("Please enter floor name");

    try {
      const url = editingId ? `/api/floors/${editingId}` : "/api/floors";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(floorForm),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFloorForm(initialFloorForm);
        fetchData();
      } else {
        alert("Failed to save floor settings");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name) return alert("Please enter room type name");

    try {
      const url = editingId ? `/api/room-types/${editingId}` : "/api/room-types";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...typeForm,
          capacity: Number(typeForm.capacity),
          defaultPrice: Number(typeForm.defaultPrice),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setTypeForm(initialTypeForm);
        fetchData();
      } else {
        alert("Failed to save room type");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return alert("Please enter category name");

    try {
      const url = editingId ? `/api/room-categories/${editingId}` : "/api/room-categories";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setCategoryForm(initialCategoryForm);
        fetchData();
      } else {
        alert("Failed to save category");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (item: any, type: string) => {
    setEditingId(item._id);
    if (type === "package") {
      setPackageForm({
        packageName: item.packageName,
        description: item.description || "",
        roomType: item.roomType,
        category: item.category,
        pricePerNight: item.pricePerNight,
        includedServices: item.includedServices?.join(", ") || "",
        status: item.status || "Active",
      });
    } else if (type === "floor") {
      setFloorForm({ name: item.name, description: item.description || "" });
    } else if (type === "type") {
      setTypeForm({ name: item.name, capacity: item.capacity, defaultPrice: item.defaultPrice });
    } else if (type === "category") {
      setCategoryForm({ name: item.name, description: item.description || "" });
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string, route: string) => {
    if (!confirm(`Are you sure you want to delete this configuration?`)) return;
    try {
      const res = await fetch(`/api/${route}/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
      else alert("Failed to delete settings configuration");
    } catch (e) {
      console.error(e);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setPackageForm(initialPackageForm);
    setFloorForm(initialFloorForm);
    setTypeForm(initialTypeForm);
    setCategoryForm(initialCategoryForm);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: reader.result }),
        });
        const data = await res.json();
        if (data.url) {
          setBusinessSettings((prev: any) => ({ ...prev, logo: data.url }));
        } else {
          alert("Logo upload failed: " + (data.error || "Unknown"));
        }
      } catch (err) {
        console.error(err);
        alert("Upload error");
      }
      setUploadingLogo(false);
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground mt-1 text-sm">Configure dynamic tariff rules, room packages, categories, and floor maps.</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading} className="rounded-xl">
          <MdRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Dynamic Tabs */}
      <div className="flex border-b border-border space-x-2">
        <button 
          onClick={() => { setActiveTab("packages"); cancelForm(); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "packages" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MdCardGiftcard className="h-4 w-4" />
          Room Packages
        </button>
        <button 
          onClick={() => { setActiveTab("floors"); cancelForm(); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "floors" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MdLayers className="h-4 w-4" />
          Floor Management
        </button>
        <button 
          onClick={() => { setActiveTab("types"); cancelForm(); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "types" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MdRoomPreferences className="h-4 w-4" />
          Room Types
        </button>
        <button 
          onClick={() => { setActiveTab("categories"); cancelForm(); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "categories" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MdCategory className="h-4 w-4" />
          Room Categories
        </button>
        <button 
          onClick={() => { setActiveTab("business"); cancelForm(); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "business" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MdSettings className="h-4 w-4" />
          Business Info
        </button>
        <button 
          onClick={() => { setActiveTab("system"); cancelForm(); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "system" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MdSettings className="h-4 w-4" />
          System Settings
        </button>
      </div>

      {/* 1. ROOM PACKAGES TAB */}
      {activeTab === "packages" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-foreground">Room Packages Configuration</h3>
            <Button onClick={() => showForm ? cancelForm() : setShowForm(true)} className="rounded-xl shadow-md">
              {showForm ? "Cancel" : <><MdAdd className="mr-2 h-5 w-5" /> Add Package</>}
            </Button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">{editingId ? "Edit Package" : "Create New Room Package"}</h3>
              <form onSubmit={handlePackageSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Package Name *</label>
                    <input required value={packageForm.packageName} onChange={e => setPackageForm({...packageForm, packageName: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="e.g. Honeymoon Special" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <input value={packageForm.description} onChange={e => setPackageForm({...packageForm, description: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Room Type</label>
                    <select value={packageForm.roomType} onChange={e => setPackageForm({...packageForm, roomType: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md">
                      {types.length > 0 ? types.map(t => <option key={t._id} value={t.name}>{t.name}</option>) : (
                        <>
                          <option>Standard</option>
                          <option>Deluxe</option>
                          <option>Family</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Room Category</label>
                    <select value={packageForm.category} onChange={e => setPackageForm({...packageForm, category: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md">
                      {categories.length > 0 ? categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>) : (
                        <>
                          <option>AC</option>
                          <option>Non-AC</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Package Price Per Night ($) *</label>
                    <input type="number" required min="1" value={packageForm.pricePerNight} onChange={e => setPackageForm({...packageForm, pricePerNight: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <select value={packageForm.status} onChange={e => setPackageForm({...packageForm, status: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md">
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Included Services (Comma separated list)</label>
                  <input value={packageForm.includedServices} onChange={e => setPackageForm({...packageForm, includedServices: e.target.value})} className="w-full p-2.5 bg-background border border-input rounded-md" />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" className="px-6 rounded-xl shadow-md h-10">
                    Save Package
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex h-[150px] items-center justify-center text-muted-foreground">Loading packages...</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Package Name</th>
                    <th className="px-6 py-4 font-semibold">Config Type</th>
                    <th className="px-6 py-4 font-semibold">Price per Night</th>
                    <th className="px-6 py-4 font-semibold">Services Included</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">
                        <div>{pkg.packageName}</div>
                        <div className="text-xs text-muted-foreground font-normal">{pkg.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold">
                          {pkg.roomType} - {pkg.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">${pkg.pricePerNight}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {pkg.includedServices?.map((s: string, idx: number) => (
                            <span key={idx} className="bg-muted px-2 py-0.5 rounded text-[10px] text-muted-foreground">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          pkg.status === "Active" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                        }`}>
                          {pkg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(pkg, "package")} className="h-8 w-8 mr-1 text-muted-foreground hover:text-primary">
                          <MdEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg._id, "room-packages")} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <MdDelete className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 2. FLOORS TAB */}
      {activeTab === "floors" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-foreground">Floor Configuration</h3>
            <Button onClick={() => showForm ? cancelForm() : setShowForm(true)} className="rounded-xl shadow-md">
              {showForm ? "Cancel" : <><MdAdd className="mr-2 h-5 w-5" /> Add Floor</>}
            </Button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">{editingId ? "Edit Floor" : "Create New Floor"}</h3>
              <form onSubmit={handleFloorSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Floor Name *</label>
                  <input required value={floorForm.name} onChange={e => setFloorForm({...floorForm, name: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="e.g. 1st Floor" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <input value={floorForm.description} onChange={e => setFloorForm({...floorForm, description: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="e.g. Standard Rooms Floor" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full rounded-xl h-10 font-bold">
                    Save Floor
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex h-[150px] items-center justify-center text-muted-foreground">Loading Floors...</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Floor Name</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {floors.map((fl) => (
                    <tr key={fl._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{fl.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{fl.description || "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(fl, "floor")} className="h-8 w-8 mr-1 text-muted-foreground hover:text-primary">
                          <MdEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(fl._id, "floors")} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <MdDelete className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 3. ROOM TYPES TAB */}
      {activeTab === "types" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-foreground">Room Types Tariff Settings</h3>
            <Button onClick={() => showForm ? cancelForm() : setShowForm(true)} className="rounded-xl shadow-md">
              {showForm ? "Cancel" : <><MdAdd className="mr-2 h-5 w-5" /> Add Room Type</>}
            </Button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">{editingId ? "Edit Room Type" : "Create New Room Type"}</h3>
              <form onSubmit={handleTypeSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Type Name *</label>
                  <input required value={typeForm.name} onChange={e => setTypeForm({...typeForm, name: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="e.g. Executive Suite" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Capacity (Guests) *</label>
                  <input type="number" required min="1" value={typeForm.capacity} onChange={e => setTypeForm({...typeForm, capacity: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Default Tariff ($) *</label>
                  <input type="number" required min="1" value={typeForm.defaultPrice} onChange={e => setTypeForm({...typeForm, defaultPrice: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full rounded-xl h-10 font-bold">
                    Save Room Type
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex h-[150px] items-center justify-center text-muted-foreground">Loading room types...</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Type Name</th>
                    <th className="px-6 py-4 font-semibold">Capacity Limit</th>
                    <th className="px-6 py-4 font-semibold">Default Tariff Price</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((ty) => (
                    <tr key={ty._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{ty.name}</td>
                      <td className="px-6 py-4">{ty.capacity} Guests Max</td>
                      <td className="px-6 py-4 font-extrabold text-primary">${ty.defaultPrice} / night</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(ty, "type")} className="h-8 w-8 mr-1 text-muted-foreground hover:text-primary">
                          <MdEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(ty._id, "room-types")} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <MdDelete className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 4. ROOM CATEGORIES TAB */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-foreground">Room Tariff Categories</h3>
            <Button onClick={() => showForm ? cancelForm() : setShowForm(true)} className="rounded-xl shadow-md">
              {showForm ? "Cancel" : <><MdAdd className="mr-2 h-5 w-5" /> Add Category</>}
            </Button>
          </div>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">{editingId ? "Edit Category" : "Create New Category"}</h3>
              <form onSubmit={handleCategorySubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Category Name *</label>
                  <input required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="e.g. Sea View" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <input value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="e.g. Rooms facing ocean front" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full rounded-xl h-10 font-bold">
                    Save Category
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex h-[150px] items-center justify-center text-muted-foreground">Loading categories...</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Category Name</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{cat.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{cat.description || "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cat, "category")} className="h-8 w-8 mr-1 text-muted-foreground hover:text-primary">
                          <MdEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat._id, "room-categories")} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <MdDelete className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 5. BUSINESS TAB */}
      {activeTab === "business" && (
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Business Details</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await fetch("/api/settings/business", { method: "POST", body: JSON.stringify(businessSettings), headers: { "Content-Type": "application/json" } });
              alert("Business settings saved!");
            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex flex-col items-center justify-center p-4 border border-dashed border-border rounded-xl bg-muted/10 mb-4">
                {businessSettings.logo ? (
                  <img src={businessSettings.logo} alt="Business Logo" className="h-20 object-contain mb-3 bg-white p-2 rounded-lg shadow-sm" />
                ) : (
                  <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-3">
                    <MdAdd className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-colors">
                    {uploadingLogo ? "Uploading..." : businessSettings.logo ? "Change Logo" : "Upload Logo"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo} onChange={handleLogoUpload} />
                </label>
                <p className="text-[10px] text-muted-foreground mt-2">Recommended: PNG or JPG, max 2MB. Transparent background.</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Hotel/Business Name</label>
                <input value={businessSettings.businessName || ""} onChange={e => setBusinessSettings({...businessSettings, businessName: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Address</label>
                <input value={businessSettings.address || ""} onChange={e => setBusinessSettings({...businessSettings, address: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Contact Phone</label>
                <input value={businessSettings.phone || ""} onChange={e => setBusinessSettings({...businessSettings, phone: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <input value={businessSettings.email || ""} onChange={e => setBusinessSettings({...businessSettings, email: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Check-in Time</label>
                <input type="time" value={businessSettings.checkInTime || "14:00"} onChange={e => setBusinessSettings({...businessSettings, checkInTime: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Check-out Time</label>
                <input type="time" value={businessSettings.checkOutTime || "11:00"} onChange={e => setBusinessSettings({...businessSettings, checkOutTime: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Invoice Footer Text / Terms & Conditions</label>
                <textarea 
                  value={businessSettings.invoiceFooterText || ""} 
                  onChange={e => setBusinessSettings({...businessSettings, invoiceFooterText: e.target.value})} 
                  className="w-full p-2 bg-background border border-input rounded-md min-h-[80px]" 
                  placeholder="e.g. Thank you for staying with us! Bank details: AC 1234..."
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" className="rounded-xl font-bold">Save Business Settings</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SYSTEM TAB */}
      {activeTab === "system" && (
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">System Configurations</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await fetch("/api/settings/system", { method: "POST", body: JSON.stringify(systemSettings), headers: { "Content-Type": "application/json" } });
              alert("System settings saved!");
            }} className="space-y-8">
              
              {/* General System Info */}
              <div>
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">General System Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">System Title</label>
                    <input value={systemSettings.systemName || ""} onChange={e => setSystemSettings({...systemSettings, systemName: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Default Currency</label>
                    <input value={systemSettings.defaultCurrency || "LKR"} onChange={e => setSystemSettings({...systemSettings, defaultCurrency: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" />
                  </div>
                </div>
              </div>

              {/* Financial & Policies */}
              <div>
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-border pb-2">Financials & Policies</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tax Percentage (%)</label>
                    <input type="number" value={systemSettings.taxPercentage || 0} onChange={e => setSystemSettings({...systemSettings, taxPercentage: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Service Charge (%)</label>
                    <input type="number" value={systemSettings.serviceChargePercentage || 0} onChange={e => setSystemSettings({...systemSettings, serviceChargePercentage: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Min Advance Payment (%)</label>
                    <input type="number" value={systemSettings.minAdvancePaymentPercentage || 0} onChange={e => setSystemSettings({...systemSettings, minAdvancePaymentPercentage: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Late Checkout Penalty ($/hr)</label>
                    <input type="number" value={systemSettings.lateCheckoutPenaltyPerHour || 0} onChange={e => setSystemSettings({...systemSettings, lateCheckoutPenaltyPerHour: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" />
                  </div>
                </div>
              </div>

              {/* SMS Automations */}
              <div>
                <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-4 border-b border-border pb-2">SMS Notifications & Automations</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3 bg-muted/20 p-4 rounded-xl border border-border">
                    <input 
                      type="checkbox" 
                      id="enableSms" 
                      checked={systemSettings.enableSms || false} 
                      onChange={e => setSystemSettings({...systemSettings, enableSms: e.target.checked})} 
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="enableSms" className="font-semibold text-sm block">Enable Automated SMS Alerts</label>
                      <p className="text-xs text-muted-foreground mt-0.5">Automatically send SMS messages to guests on check-in and check-out.</p>
                    </div>
                  </div>
                  {systemSettings.enableSms && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Check-in SMS Template</label>
                        <textarea 
                          value={systemSettings.checkInSmsTemplate || ""} 
                          onChange={e => setSystemSettings({...systemSettings, checkInSmsTemplate: e.target.value})} 
                          className="w-full p-2 bg-background border border-input rounded-md min-h-[80px]" 
                          placeholder="Hi [GuestName], welcome to our hotel!"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Use [GuestName] to dynamically insert the guest's name.</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Check-out SMS Template</label>
                        <textarea 
                          value={systemSettings.checkOutSmsTemplate || ""} 
                          onChange={e => setSystemSettings({...systemSettings, checkOutSmsTemplate: e.target.value})} 
                          className="w-full p-2 bg-background border border-input rounded-md min-h-[80px]" 
                          placeholder="Hi [GuestName], thank you for staying!"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Use [GuestName] to dynamically insert the guest's name.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security & Access */}
              <div>
                <h4 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-4 border-b border-border pb-2">Security & Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 bg-muted/20 p-4 rounded-xl border border-border">
                    <input 
                      type="checkbox" 
                      id="receptionistReports" 
                      checked={systemSettings.receptionistCanViewReports !== false} 
                      onChange={e => setSystemSettings({...systemSettings, receptionistCanViewReports: e.target.checked})} 
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="receptionistReports" className="font-semibold text-sm block">Allow Receptionists to View Reports</label>
                      <p className="text-xs text-muted-foreground mt-0.5">If disabled, only Managers/Admins can see the Reports tab.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-muted/20 p-4 rounded-xl border border-border">
                    <input 
                      type="checkbox" 
                      id="allowPos" 
                      checked={systemSettings.allowPosRoomCharges !== false} 
                      onChange={e => setSystemSettings({...systemSettings, allowPosRoomCharges: e.target.checked})} 
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="allowPos" className="font-semibold text-sm block">Allow POS Orders to Room Bill</label>
                      <p className="text-xs text-muted-foreground mt-0.5">If disabled, all food & beverage orders must be paid immediately.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button type="submit" className="rounded-xl font-bold px-8 h-12 text-base">Save System Settings</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
