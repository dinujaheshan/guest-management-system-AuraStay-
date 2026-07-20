"use client";

import { useState, useEffect } from "react";
import { MdPeople, MdAdd, MdDelete, MdEdit, MdRefresh, MdCheck } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const initialFormData = {
  name: "",
  email: "",
  password: "",
  role: "admin",
  status: "active",
  permissions: [] as string[]
};

const MODULES = [
  { id: "dashboard", label: "Dashboard", actions: [] },
  { id: "bookings", label: "Bookings", actions: ["create", "update", "delete"] },
  { id: "guests", label: "Guests", actions: ["create", "update", "delete"] },
  { id: "rooms", label: "Rooms", actions: ["create", "update", "delete"] },
  { id: "menu", label: "Menu & POS", actions: ["create", "update", "delete"] },
  { id: "charges", label: "Charges", actions: ["create", "update", "delete"] },
  { id: "billing", label: "Billing", actions: ["create", "update", "delete"] },
  { id: "expenses", label: "Expenses", actions: ["create", "update", "delete"] },
  { id: "reports", label: "Reports", actions: [] },
  { id: "users", label: "Users", actions: ["create", "update", "delete"] },
  { id: "settings", label: "Settings", actions: ["update"] }
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === "super_admin";

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/users/${editingId}` : "/api/users";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setEditingId(null);
        fetchUsers();
        setFormData(initialFormData);
      } else {
        const error = await res.json();
        alert(error.error || `Failed to ${editingId ? "update" : "create"} user`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (user: any) => {
    setEditingId(user._id);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password
      role: user.role,
      status: user.status,
      permissions: user.permissions || []
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
      else {
        const error = await res.json();
        alert(error.error || "Failed to delete user");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cancelForm = () => {
    setEditingId(null);
    setFormData(initialFormData);
  };

  const toggleMainPermission = (moduleId: string) => {
    const readPerm = `${moduleId}:read`;
    setFormData(prev => {
      let perms = [...prev.permissions];
      if (perms.includes(readPerm)) {
        // Remove read and all sub-actions
        perms = perms.filter(p => !p.startsWith(`${moduleId}:`));
      } else {
        // Add read
        perms.push(readPerm);
      }
      return { ...prev, permissions: perms };
    });
  };

  const toggleSubPermission = (moduleId: string, action: string) => {
    const permString = `${moduleId}:${action}`;
    const readPerm = `${moduleId}:read`;
    
    setFormData(prev => {
      let perms = [...prev.permissions];
      // If adding a sub-permission, ensure read is also granted
      if (!perms.includes(permString)) {
        perms.push(permString);
        if (!perms.includes(readPerm)) perms.push(readPerm);
      } else {
        perms = perms.filter(p => p !== permString);
      }
      return { ...prev, permissions: perms };
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Administrators & Permissions</h2>
        <p className="text-muted-foreground mt-1 text-sm">Manage admin credentials and restrict access to specific features.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Column - Authorized Users */}
        <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border/50 flex items-center justify-between bg-muted/20">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground/80">
              <MdPeople className="text-primary h-5 w-5" /> Authorized System Users
            </h3>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="rounded-xl h-8">
              <MdRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Name / Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Module Permissions <span className="font-normal normal-case opacity-70">(Checked = Restrict Off)</span></th>
                  <th className="px-6 py-4 text-right">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr><td colSpan={4} className="h-32 text-center text-muted-foreground">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="h-32 text-center text-muted-foreground">No users found</td></tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-5 align-top">
                        <div className="font-semibold text-foreground">{user.name}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">{user.email}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest",
                          user.role === 'super_admin' ? "bg-rose-500/10 text-rose-600" :
                          user.role === 'admin' ? "bg-purple-500/10 text-purple-600" :
                          user.role === 'restaurant_pos' ? "bg-orange-500/10 text-orange-600" :
                          "bg-blue-500/10 text-blue-600"
                        )}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top max-w-[400px] whitespace-normal">
                        {user.role === 'super_admin' ? (
                          <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs uppercase tracking-wider mt-1">
                            <MdCheck className="h-4 w-4" /> Unrestricted System Override
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {MODULES.map(mod => {
                              const hasRead = (user.permissions || []).includes(`${mod.id}:read`);
                              if (!hasRead) return null;
                              
                              const activeActions = mod.actions.filter(a => (user.permissions || []).includes(`${mod.id}:${a}`));
                              
                              return (
                                <div key={mod.id} className="border border-border/50 rounded-lg p-2 bg-background shadow-sm min-w-[120px]">
                                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground mb-1">
                                    <div className="w-3 h-3 rounded-sm bg-primary flex items-center justify-center">
                                      <MdCheck className="text-[8px] text-primary-foreground" />
                                    </div>
                                    {mod.label}
                                  </div>
                                  {mod.actions.length > 0 && (
                                    <div className="flex flex-col gap-0.5 pl-4">
                                      {mod.actions.map(action => (
                                        <div key={action} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                          <div className={cn("w-2 h-2 rounded-sm border", activeActions.includes(action) ? "bg-primary/80 border-primary/80" : "border-border")}></div>
                                          <span className="capitalize">{action}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {(!user.permissions || user.permissions.length === 0) && (
                              <span className="text-muted-foreground text-xs italic">No specific permissions</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 align-top text-right">
                        <div className="flex items-center justify-end gap-3 mt-1">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            user.status === 'active' ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {user.status}
                          </span>
                          <button onClick={() => handleEdit(user)} className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(user._id)} className="text-xs font-bold text-rose-500 hover:underline uppercase tracking-wider">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Create/Edit Form */}
        <div className="w-full xl:w-[400px] 2xl:w-[450px] shrink-0 xl:sticky xl:top-6 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
          <div className="p-5 border-b border-border/50 bg-muted/20 flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground/80">
              <MdAdd className="text-primary h-5 w-5" /> {editingId ? "Edit Account" : "Create Account"}
            </h3>
            {editingId && (
              <button onClick={cancelForm} className="text-xs font-bold text-muted-foreground hover:text-foreground">CANCEL</button>
            )}
          </div>
          
          <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
            <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Full Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="e.g. Amaya Perera" />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Email Address</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="amaya@aurastay.com" />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                  Password {editingId && <span className="font-normal opacity-70">(Leave blank to keep current)</span>}
                </label>
                <input type="password" required={!editingId} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="********" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Status</label>
                <div className="flex bg-muted/30 p-1 rounded-xl">
                  <button type="button" onClick={() => setFormData({...formData, status: "active"})} className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider", formData.status === "active" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground hover:text-foreground")}>Active</button>
                  <button type="button" onClick={() => setFormData({...formData, status: "disabled"})} className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider", formData.status === "disabled" ? "bg-background shadow-sm text-rose-600" : "text-muted-foreground hover:text-foreground")}>Disabled</button>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">System Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "receptionist", label: "Reception" },
                    { id: "restaurant_pos", label: "POS" },
                    { id: "admin", label: "Admin" },
                    { id: "super_admin", label: "Super Admin" }
                  ].map(role => (
                    <button 
                      key={role.id} 
                      type="button" 
                      onClick={() => setFormData({...formData, role: role.id})} 
                      className={cn(
                        "py-2.5 text-xs font-bold rounded-xl border transition-all uppercase tracking-wider", 
                        formData.role === role.id 
                          ? role.id === 'super_admin' ? "bg-rose-500/10 border-rose-500/20 text-rose-600" : "bg-primary/10 border-primary/20 text-primary"
                          : "bg-background border-input text-muted-foreground hover:border-border"
                      )}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Permissions */}
              {isSuperAdmin && formData.role !== 'super_admin' && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 block">Initial Permissions</label>
                  <div className="space-y-4">
                    {MODULES.map(module => {
                      const hasRead = formData.permissions.includes(`${module.id}:read`);
                      return (
                        <div key={module.id} className="flex flex-col gap-1.5">
                          <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
                            <div className={cn("w-4 h-4 rounded-md border flex items-center justify-center transition-colors", hasRead ? "bg-primary border-primary" : "border-input bg-background group-hover:border-primary/50")}>
                              {hasRead && <MdCheck className="text-primary-foreground text-[10px]" />}
                            </div>
                            <span className={cn("text-sm font-semibold transition-colors", hasRead ? "text-foreground" : "text-muted-foreground")}>{module.label}</span>
                            <input type="checkbox" className="sr-only" checked={hasRead} onChange={() => toggleMainPermission(module.id)} />
                          </label>
                          
                          {module.actions.length > 0 && (
                            <div className="flex gap-4 ml-6.5 pl-6">
                              {module.actions.map(action => {
                                const hasAction = formData.permissions.includes(`${module.id}:${action}`);
                                return (
                                  <label key={action} className={cn("flex items-center gap-1.5 cursor-pointer group", !hasRead && "opacity-40 pointer-events-none")}>
                                    <div className={cn("w-3 h-3 rounded-sm border flex items-center justify-center transition-colors", hasAction ? "bg-primary border-primary" : "border-input bg-background")}>
                                      {hasAction && <MdCheck className="text-primary-foreground text-[8px]" />}
                                    </div>
                                    <span className="text-xs text-muted-foreground capitalize">{action}</span>
                                    <input type="checkbox" className="sr-only" disabled={!hasRead} checked={hasAction} onChange={() => toggleSubPermission(module.id, action)} />
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          </div>
          
          <div className="p-5 border-t border-border/50 bg-background/50 backdrop-blur-sm">
            <Button form="user-form" type="submit" className="w-full h-12 rounded-xl text-sm font-bold shadow-md bg-rose-500 hover:bg-rose-600 text-white">
              {editingId ? "UPDATE USER ACCOUNT" : "CREATE USER ACCOUNT"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
