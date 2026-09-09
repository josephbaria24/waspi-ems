"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { Settings, LogOut, Bell, Search, QrCode, Users, FileUp, UserPlus, Ticket } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { useRouter } from "next/navigation"

type NotificationItem = {
  id: string
  type: "registration" | "receipt" | "attendee"
  title: string
  description: string
  createdAt: string
  href: string
}

const SEEN_KEY = "waspi-notif-seen"

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.floor(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface NavigationProps {
  currentEventId?: string | null
  onQRScanClick?: () => void
}

export function Navigation({ currentEventId, onQRScanClick }: NavigationProps) {
  const [active, setActive] = useState<"events" | "qr" | "settings" | "membership">("events")
  const router = useRouter()

  const handleComingSoon = () => {
    toast.info("🚧 This feature will be available soon!", { duration: 3000 })
  }

  const handleQRScanner = () => {
    if (!currentEventId) {
      toast.error("Please select an event first to use QR Scanner")
      return
    }

    setActive("qr")
    if (onQRScanClick) {
      onQRScanClick()
    } else {
      router.push(`/events/${currentEventId}/qr-scan`)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success("👋 You've been logged out successfully.")
      window.location.href = "/login"
    } catch (err: any) {
      console.error("Logout error:", err)
      toast.error("Failed to log out. Please try again.")
    }
  }

  return (
    <>
      {/* Top navigation bar */}
      <nav className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 relative">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent">
              <img src="/waspi-logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            </div>

            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-bold text-foreground text-lg">WASPI</span>
              <span className="text-sm text-muted-foreground">Event Management System</span>
            </div>
          </div>

          {/* Center Nav */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:flex gap-1">

            <NavIcon
              icon={QrCode}
              label="QR Scanner"
              onClick={handleQRScanner}
              disabled={!currentEventId}
              active={active === "qr"}
            />
            <NavIcon
              icon={Users}
              label="Membership"
              onClick={() => {
                setActive("membership")
                router.push("/membership/admin")
              }}
              active={active === "membership"}
            />
            <NavIcon
              icon={Settings}
              label="Settings"
              onClick={() => {
                handleComingSoon()
                setActive("settings")
              }}
              active={active === "settings"}
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search (md+) */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <NotificationBell />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-destructive"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* 📱 Floating QR Scanner button */}
      <button
        onClick={handleQRScanner}
        disabled={!currentEventId}
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center rounded-full p-4 shadow-lg transition-all sm:hidden ${currentEventId
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        title="Open QR Scanner"
      >
        <QrCode className="h-6 w-6" />
      </button>
    </>
  )
}

function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [seen, setSeen] = useState<string[]>([])

  useEffect(() => {
    try {
      setSeen(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"))
    } catch {
      setSeen([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (items.length === 0) setLoading(true)
      try {
        const response = await fetch("/api/notifications")
        const result = await response.json()
        if (!cancelled && response.ok) {
          setItems(result.notifications || [])
        }
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open])

  const unread = items.filter((item) => !seen.includes(item.id)).length

  const markAllRead = () => {
    const ids = Array.from(new Set([...seen, ...items.map((item) => item.id)]))
    setSeen(ids)
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids))
  }

  const markOneRead = (id: string) => {
    if (seen.includes(id)) return
    const ids = [...seen, id]
    setSeen(ids)
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00D47E] px-1 text-[10px] font-bold text-black">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-[#E8EAEB] p-0 shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E8EAEB] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-xs text-muted-foreground">Registrations, receipts, and event sign-ups</p>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unread === 0}
            className="shrink-0 pt-0.5 text-xs font-medium text-[#16a35c] transition-opacity hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline disabled:opacity-60"
          >
            Mark all as read
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading notifications…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            items.map((item) => {
              const Icon = item.type === "receipt" ? FileUp : item.type === "attendee" ? Ticket : UserPlus
              const isUnread = !seen.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    markOneRead(item.id)
                    setOpen(false)
                    router.push(item.href)
                  }}
                  className={`flex w-full items-start gap-3 border-b border-[#F2F4F4] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#F7FBF8] ${isUnread ? "bg-[#F4FBF7]" : ""}`}
                >
                  <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF9F1] text-[#16a35c]">
                    <Icon className="h-4 w-4" />
                    {isUnread && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#00D47E]" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${isUnread ? "font-semibold" : "font-medium"} text-foreground`}>{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.description}</span>
                    <span className="mt-1 block text-[11px] text-[#8D959D]">{timeAgo(item.createdAt)}</span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NavIcon({
  icon: Icon,
  label,
  active,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active
          ? "bg-primary text-primary-foreground"
          : disabled
            ? "text-muted-foreground/50 cursor-not-allowed"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
