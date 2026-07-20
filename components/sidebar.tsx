"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { 
  MdDashboard, 
  MdMeetingRoom, 
  MdBookOnline, 
  MdPeople,
  MdRestaurantMenu,
  MdReceipt,
  MdSettings,
  MdLogin,
  MdLogout,
  MdAttachMoney,
  MdBarChart,
  MdReceiptLong,
  MdCalendarMonth,
  MdInventory
} from "react-icons/md"
import { Logo } from "./ui/logo"
import { motion } from "framer-motion"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: MdDashboard, perm: "dashboard:read" },
  { name: "Calendar", href: "/calendar", icon: MdCalendarMonth, perm: "bookings:read" },
  { name: "Rooms", href: "/rooms", icon: MdMeetingRoom, perm: "rooms:read" },
  { name: "Bookings", href: "/bookings", icon: MdBookOnline, perm: "bookings:read" },
  { name: "Check-In", href: "/checkin", icon: MdLogin, perm: "bookings:read" },
  { name: "Check-Out", href: "/checkout", icon: MdLogout, perm: "bookings:read" },
  { name: "Guests", href: "/guests", icon: MdPeople, perm: "guests:read" },
  { name: "Menu / POS", href: "/menu", icon: MdRestaurantMenu, perm: "menu:read" },
  { name: "Inventory", href: "/inventory", icon: MdInventory, perm: "menu:read" },
  { name: "Charges", href: "/charges", icon: MdAttachMoney, perm: "charges:read" },
  { name: "Billing", href: "/billing", icon: MdReceipt, perm: "billing:read" },
  { name: "Expenses", href: "/expenses", icon: MdReceiptLong, perm: "expenses:read" },
  { name: "Reports", href: "/reports", icon: MdBarChart, perm: "reports:read" },
  { name: "Users", href: "/users", icon: MdPeople, perm: "users:read" },
  { name: "Settings", href: "/settings", icon: MdSettings, perm: "settings:read" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const user = session?.user as any
  const isSuperAdmin = user?.role === "super_admin"
  const userPermissions = user?.permissions || []

  return (
    <div className="w-[280px] border-r border-border/50 bg-card/80 backdrop-blur-xl flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] hidden md:flex transition-all duration-300 relative z-20 print:hidden">
      <div className="h-20 flex items-center px-8 border-b border-border/50 z-10 gap-3">
        <Logo className="w-8 h-8 drop-shadow-sm" />
        <h1 className="text-2xl font-black tracking-tight text-primary">
          AuraStay
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-8 custom-scrollbar">
        <nav className="space-y-2 px-5">
          <p className="px-3 text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mb-6">Main Menu</p>
          {navItems.map((item) => {
            // Check permissions: show if super_admin or if user has the required permission
            const hasAccess = isSuperAdmin || userPermissions.includes(item.perm)
            if (!hasAccess) return null
            
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-primary rounded-2xl -z-10" 
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white/20 rounded-r-full" />}
                
                <item.icon className={cn(
                  "mr-3.5 h-5 w-5 transition-all duration-300 group-hover:scale-110", 
                  isActive ? "text-primary-foreground drop-shadow-sm" : "text-muted-foreground group-hover:text-primary"
                )} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
