"use client";

import { useState, useEffect } from "react";
import { MdRestaurantMenu, MdShoppingCart, MdAdd, MdRefresh, MdEdit, MdDelete, MdShoppingBag, MdImage, MdClose, MdSearch } from "react-icons/md";
import { Button } from "@/components/ui/button";

const initialFormData = {
  itemName: "",
  category: "Food",
  price: 5.0,
  stockQuantity: 10,
  imageUrl: "",
  isInventoryTracked: true,
};

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState<"pos" | "inventory">("pos");
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeStays, setActiveStays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");

  const [systemSettings, setSystemSettings] = useState<any>({});
  const filteredMenuItems = menuItems.filter(item => 
    `${item.itemName} ${item.category}`
      .toLowerCase()
      .includes(menuSearchQuery.toLowerCase())
  );

  // POS State
  const [selectedStayId, setSelectedStayId] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [payNow, setPayNow] = useState(false);
  const [posPayMethod, setPosPayMethod] = useState("Cash");

  // Inventory/GRN State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // GRN Stock update
  const [stockToUpdateId, setStockToUpdateId] = useState<string | null>(null);
  const [addedStockQty, setAddedStockQty] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, staysRes, sysRes] = await Promise.all([
        fetch("/api/menu-items"),
        fetch("/api/bookings"),
        fetch("/api/settings/system"),
      ]);
      const menuData = await menuRes.json();
      const staysData = await staysRes.json();
      const sysData = await sysRes.json();
      
      setMenuItems(Array.isArray(menuData) ? menuData : []);
      setSystemSettings(sysData || {});
      // Only stays with status "Checked In" can order food
      setActiveStays(Array.isArray(staysData) ? staysData.filter((s: any) => s.status === "Checked In") : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePOSOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStayId) return alert("Please select a Room / Stay");
    if (!selectedItem) return alert("Please select a Menu Item");
    if (orderQty <= 0) return alert("Quantity must be greater than 0");

    try {
      const res = await fetch("/api/food-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedStayId,
          menuItemId: selectedItem._id,
          quantity: Number(orderQty),
          payNow,
          paymentMethod: payNow ? posPayMethod : undefined,
        }),
      });

      if (res.ok) {
        alert("Food order placed successfully! Added to stay folio.");
        setSelectedItem(null);
        setOrderQty(1);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to place order");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingImage(true);
    try {
      let uploadedUrl = formData.imageUrl;
      if (imageFile) {
        // Read file as base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
        reader.readAsDataURL(imageFile);
        const base64Str = await base64Promise;

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64Str }),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          uploadedUrl = uploadData.url;
        } else {
          alert("Image upload failed: " + uploadData.error);
          setUploadingImage(false);
          return;
        }
      }

      const url = editingId ? `/api/menu-items/${editingId}` : "/api/menu-items";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stockQuantity: formData.isInventoryTracked ? Number(formData.stockQuantity) : 0,
          imageUrl: uploadedUrl,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
        setImageFile(null);
        fetchData();
      } else {
        alert("Failed to save menu item");
      }
    } catch (e) {
      console.error(e);
    }
    setUploadingImage(false);
  };

  const handleGRNSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockToUpdateId) return;

    const item = menuItems.find(i => i._id === stockToUpdateId);
    if (!item) return;

    try {
      const res = await fetch(`/api/menu-items/${stockToUpdateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockQuantity: item.stockQuantity + Number(addedStockQty),
        }),
      });

      if (res.ok) {
        alert("Stock updated successfully (GRN recorded)!");
        setStockToUpdateId(null);
        fetchData();
      } else {
        alert("Failed to update stock");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item._id);
    setFormData({
      itemName: item.itemName,
      category: item.category,
      price: item.price,
      stockQuantity: item.stockQuantity,
      imageUrl: item.imageUrl || "",
      isInventoryTracked: item.isInventoryTracked ?? true,
    });
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
      else alert("Failed to delete (Admin role required)");
    } catch (e) {
      console.error(e);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
    setImageFile(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Menu & POS-Lite</h2>
          <p className="text-muted-foreground mt-1 text-sm">Order food/beverages for active stays or manage property stock.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading} className="rounded-xl">
            <MdRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button 
          onClick={() => setActiveTab("pos")}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "pos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MdShoppingCart className="h-4 w-4" />
          Point of Sale (POS)
        </button>
        <button 
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "inventory" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MdRestaurantMenu className="h-4 w-4" />
          Menu Inventory
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input 
            type="text" 
            placeholder="Search menu items by name or category..." 
            value={menuSearchQuery}
            onChange={(e) => setMenuSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* POS Tab */}
      {activeTab === "pos" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Select Items</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredMenuItems.map((item) => (
                  <div 
                    key={item._id}
                    onClick={() => (item.isInventoryTracked === false || item.stockQuantity > 0) && setSelectedItem(item)}
                    className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all select-none ${
                      selectedItem?._id === item._id 
                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                        : (item.isInventoryTracked !== false && item.stockQuantity <= 0)
                        ? "bg-muted border-muted text-muted-foreground cursor-not-allowed opacity-50"
                        : "bg-background border-border hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <div>
                      {item.imageUrl ? (
                        <div className="w-full h-24 mb-3 rounded-lg overflow-hidden relative border border-border">
                          <img src={item.imageUrl} alt={item.itemName} className="w-full h-full object-cover" />
                          <span className={`absolute top-1 right-1 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                            selectedItem?._id === item._id 
                              ? "bg-white/90 text-primary" 
                              : "bg-background/90 text-primary backdrop-blur-sm"
                          }`}>
                            {item.category}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-24 mb-3 rounded-lg bg-muted flex items-center justify-center border border-border">
                          <MdImage className="h-8 w-8 text-muted-foreground opacity-30" />
                          <span className={`absolute top-2 right-2 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                            selectedItem?._id === item._id 
                              ? "bg-white/20 text-white" 
                              : "bg-primary/10 text-primary"
                          }`}>
                            {item.category}
                          </span>
                        </div>
                      )}
                      <h4 className="font-bold text-sm mt-1">{item.itemName}</h4>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                      <span className="font-black text-sm">${item.price}</span>
                      <span className="text-[10px] opacity-75 font-semibold">
                        {item.isInventoryTracked === false ? "Not Tracked" : `Stock: ${item.stockQuantity}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MdShoppingCart className="text-primary h-5 w-5" />
                POS Lite Cart
              </h3>
              
              <form onSubmit={handlePOSOrderSubmit} className="space-y-6">
                {/* Select Stay */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Active Guest Room Stay *</label>
                  <select 
                    required 
                    value={selectedStayId} 
                    onChange={e => setSelectedStayId(e.target.value)} 
                    className="w-full p-2.5 bg-background border border-input rounded-xl"
                  >
                    <option value="">-- Select Room --</option>
                    {activeStays.map((stay) => (
                      <option key={stay._id} value={stay._id}>
                        Room {stay.roomIds?.map((r: any) => r.roomNumber).join(", ")} - {stay.guestId?.firstName} {stay.guestId?.lastName}
                      </option>
                    ))}
                    {activeStays.length === 0 && <option value="" disabled>No Checked-In stays found</option>}
                  </select>
                </div>

                {/* Selected Item details */}
                {selectedItem ? (
                  <div className="space-y-4 bg-muted/20 border border-border rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{selectedItem.itemName}</h4>
                        <p className="text-xs text-muted-foreground">{selectedItem.category} - ${selectedItem.price} each</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedItem(null)} 
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        Clear
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Quantity *</label>
                      <input 
                        type="number" 
                        required 
                        min="1" 
                        max={selectedItem.isInventoryTracked === false ? undefined : selectedItem.stockQuantity}
                        value={orderQty} 
                        onChange={e => setOrderQty(
                          selectedItem.isInventoryTracked === false 
                            ? Number(e.target.value) 
                            : Math.min(selectedItem.stockQuantity, Number(e.target.value))
                        )}
                        className="w-full p-2 border border-input bg-background rounded-lg text-sm" 
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border/50 text-sm">
                      <span className="font-semibold text-muted-foreground">Subtotal:</span>
                      <span className="font-extrabold text-primary text-base">${(selectedItem.price * orderQty).toFixed(2)}</span>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Payment Option</label>
                      <div className="grid grid-cols-2 gap-2">
                        {systemSettings.allowPosRoomCharges !== false && (
                          <button 
                            type="button" 
                            onClick={() => setPayNow(false)} 
                            className={`p-2 rounded-lg border text-sm font-semibold transition-all ${!payNow ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}
                          >
                            Add to Room Bill
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={() => setPayNow(true)} 
                          className={`p-2 rounded-lg border text-sm font-semibold transition-all ${payNow ? "bg-emerald-600 text-white border-emerald-600" : "bg-background border-border text-muted-foreground hover:border-emerald-600/50"} ${systemSettings.allowPosRoomCharges === false ? 'col-span-2' : ''}`}
                        >
                          Pay Immediately
                        </button>
                      </div>
                      
                      {payNow && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Payment Method</label>
                          <select 
                            value={posPayMethod} 
                            onChange={e => setPosPayMethod(e.target.value)} 
                            className="w-full p-2 bg-background border border-input rounded-lg text-sm"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Mobile Wallet">Mobile Wallet</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[120px] border-2 border-dashed border-border rounded-xl text-muted-foreground p-4 text-center">
                    <MdShoppingBag className="h-6 w-6 opacity-30 mb-1" />
                    <p className="text-xs">No food item selected. Click on a menu item card to select.</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={!selectedItem || !selectedStayId} 
                  className="w-full h-12 text-base font-bold rounded-xl shadow-md"
                >
                  Confirm POS Order
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-foreground">Manage Menu Catalogue</h3>
            <Button onClick={() => showForm ? cancelForm() : setShowForm(true)} className="rounded-xl shadow-md">
              {showForm ? "Cancel" : <><MdAdd className="mr-2 h-5 w-5" /> Add Menu Item</>}
            </Button>
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">{editingId ? "Edit Menu Item" : "Add Menu Item"}</h3>
              <form onSubmit={handleInventorySubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Item Name</label>
                  <input required value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md" placeholder="e.g. Fried Rice" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 bg-background border border-input rounded-md">
                    <option>Food</option>
                    <option>Beverage</option>
                    <option>Product</option>
                    <option>Service</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Price ($)</label>
                  <input type="number" required min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Item Image</label>
                  <input type="file" accept="image/*" onChange={e => e.target.files && setImageFile(e.target.files[0])} className="w-full p-1.5 bg-background border border-input rounded-md text-sm" />
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <input 
                    type="checkbox" 
                    id="trackInventory" 
                    checked={formData.isInventoryTracked}
                    onChange={(e) => setFormData({...formData, isInventoryTracked: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="trackInventory" className="text-sm font-medium text-foreground">
                    Track Inventory Stock
                  </label>
                </div>
                {formData.isInventoryTracked && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Stock Quantity</label>
                    <input type="number" required min="0" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} className="w-full p-2 bg-background border border-input rounded-md" />
                  </div>
                )}
                <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-2">
                  <Button type="submit" disabled={uploadingImage} className="px-6 rounded-xl shadow-md h-10">
                    {uploadingImage ? "Uploading & Saving..." : editingId ? "Update Item" : "Save Item"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Item catalogue list */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">Loading menu catalogue...</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Item Name</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Stock Quantity</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenuItems.map((item) => (
                    <tr key={item._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">{item.itemName}</td>
                      <td className="px-6 py-4">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 font-bold">${item.price}</td>
                      <td className="px-6 py-4">
                        {item.isInventoryTracked === false ? (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-muted text-muted-foreground">
                            Not Tracked
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            item.stockQuantity <= 5 ? "bg-rose-500 text-white animate-pulse shadow-sm" : "bg-emerald-500/10 text-emerald-600"
                          }`}>
                            {item.stockQuantity} items {item.stockQuantity <= 5 && " (LOW STOCK)"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {item.isInventoryTracked !== false && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setStockToUpdateId(item._id)} 
                            className="mr-2 rounded-lg text-xs"
                          >
                            GRN Stock Add
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 mr-1 text-muted-foreground hover:text-primary">
                          <MdEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item._id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <MdDelete className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* GRN Stock Add Modal */}
          {stockToUpdateId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-base">GRN - Add Stock</h3>
                  <button onClick={() => setStockToUpdateId(null)} className="p-1 hover:bg-muted rounded">
                    <MdClose className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleGRNSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold block mb-1">Item to update:</label>
                    <p className="font-bold text-sm text-foreground">
                      {menuItems.find(i => i._id === stockToUpdateId)?.itemName}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold block mb-1">Current Stock:</label>
                    <p className="font-bold text-xs text-primary">
                      {menuItems.find(i => i._id === stockToUpdateId)?.stockQuantity} items
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Quantity to Add (GRN):</label>
                    <input 
                      type="number" 
                      required 
                      min="1" 
                      value={addedStockQty} 
                      onChange={e => setAddedStockQty(Number(e.target.value))} 
                      className="w-full p-2 border border-input bg-background rounded-lg" 
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl h-11 font-bold">
                    Add to Inventory
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
