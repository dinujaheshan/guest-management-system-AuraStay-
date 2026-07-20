"use client"

import { ThemeToggle } from "./theme-toggle"
import { MdNotifications, MdAccountCircle, MdSearch } from "react-icons/md"
import { Button } from "./ui/button"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"

export function Topbar() {
  const { data: session } = useSession()

  return (
    <header className="h-20 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-8 z-10 sticky top-0 shadow-[0_4px_24px_rgba(0,0,0,0.02)] print:hidden">
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search bookings, guests, or rooms..." 
            className="w-full pl-12 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center space-x-2 bg-muted/30 px-2 py-1 rounded-full border border-border/50">
          <ThemeToggle />
        </div>
        
        <div className="relative group">
          <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-muted/80 h-10 w-10 cursor-pointer">
            <MdNotifications className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse"></span>
          </Button>
          
          {/* Notifications Dropdown */}
          <div className="absolute right-0 mt-2 w-72 bg-card border border-border/50 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
            <div className="p-4 border-b border-border/50">
              <h4 className="font-bold text-sm">Notifications</h4>
            </div>
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications right now.
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 pl-5 ml-2 border-l border-border/50 h-10">
          <div className="hidden sm:flex flex-col text-right">
            <p className="text-sm font-bold leading-none text-foreground/90">{session?.user?.name || 'Loading...'}</p>
            <p className="text-[11px] font-medium text-muted-foreground capitalize mt-1 tracking-wide">{(session?.user as any)?.role || 'User'}</p>
          </div>
          
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
              <MdAccountCircle className="h-6 w-6 text-primary" />
            </div>
            
            {/* Simple Dropdown on hover */}
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border/50 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
              <div className="p-2">
                <Link href="/users" className="block px-3 py-2 text-sm text-foreground/80 font-medium hover:bg-muted rounded-xl cursor-pointer transition-colors">Profile</Link>
                <Link href="/settings" className="block px-3 py-2 text-sm text-foreground/80 font-medium hover:bg-muted rounded-xl cursor-pointer transition-colors">Settings</Link>
                <div className="h-px bg-border/50 my-1 mx-2" />
                <div 
                  onClick={() => signOut()}
                  className="px-3 py-2 text-sm text-destructive font-medium hover:bg-destructive/10 rounded-xl cursor-pointer transition-colors"
                >
                  Logout
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
