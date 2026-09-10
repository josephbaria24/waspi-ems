"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { Settings, LogOut, Bell, Search, QrCode, Users, FileUp, UserPlus, Ticket } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import { clearSupabaseSession, getSupabaseAuthStorageKey } from "@/lib/persist-supabase-session"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  const pathname = usePathname()
  const router = useRouter()
  const onQrPage = pathname.includes("/qr-scan")
  const onMembership = pathname.startsWith("/membership")
  const onSettings = pathname.startsWith("/settings")

  const handleQRScanner = () => {
    if (!currentEventId) {
      toast.error("Please select an event first to use QR Scanner")
      return
    }

    if (onQRScanClick) {
      onQRScanClick()
    } else {
      router.push(`/events/${currentEventId}/qr-scan`)
    }
  }

  const handleLogout = () => {
    // Always clear locally and redirect immediately — never wait on supabase.co.
    let accessToken = ""
    try {
      const storageKey = getSupabaseAuthStorageKey()
      if (storageKey) {
        const raw = window.localStorage.getItem(storageKey)
        if (raw) accessToken = JSON.parse(raw)?.access_token || ""
      }
    } catch {
      // ignore
    }

    clearSupabaseSession()
    void supabase.auth.signOut({ scope: "local" }).catch(() => null)

    if (accessToken) {
      const controller = new AbortController()
      window.setTimeout(() => controller.abort(), 1500)
      void fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
        signal: controller.signal,
      }).catch(() => null)
    }

    window.location.replace("/login")
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-[#E8EAEB] bg-white/95 backdrop-blur">
        <div className="relative flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/events")}
            className="flex items-center gap-3 text-left"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B1F14]">
              <img src="/waspi-logo.png" alt="WASPI" className="h-8 w-8 object-contain" />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-base font-semibold text-[#0B1F14]">WASPI</span>
              <span className="text-xs text-[#8D959D]">Event Management</span>
            </span>
          </button>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-[#E8EAEB] bg-[#F7FBF8] p-1 sm:flex">
            <NavIcon
              icon={QrCode}
              label="QR Scanner"
              onClick={handleQRScanner}
              disabled={!currentEventId}
              active={onQrPage}
            />
            <NavIcon
              icon={Users}
              label="Membership"
              onClick={() => router.push("/membership/admin")}
              active={onMembership}
            />
            <NavIcon
              icon={Settings}
              label="Settings"
              onClick={() => router.push("/settings")}
              active={onSettings}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D959D]" />
              <input
                type="text"
                placeholder="Search..."
                className="h-10 w-44 rounded-full border border-[#E8EAEB] bg-[#F7FBF8] pl-9 pr-4 text-sm text-[#1E1E1E] placeholder:text-[#8D959D] focus-visible:border-[#00D47E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D47E]/20 lg:w-56"
              />
            </div>

            <NotificationBell />

            <button
              onClick={() => router.push("/settings")}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition sm:hidden ${
                onSettings ? "bg-[#00D47E] text-[#0B1F14]" : "text-[#8D959D] hover:bg-[#F7FBF8] hover:text-[#0B1F14]"
              }`}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#8D959D] transition hover:bg-red-50 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <button
        onClick={handleQRScanner}
        disabled={!currentEventId}
        className={`fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center rounded-full p-4 shadow-lg transition-all sm:hidden ${
          currentEventId
            ? "bg-[#00D47E] text-[#0B1F14] hover:bg-[#00c174]"
            : "cursor-not-allowed bg-[#E8EAEB] text-[#8D959D]"
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
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#8D959D] transition-colors hover:bg-[#F7FBF8] hover:text-[#0B1F14]"
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
      className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-[#00D47E] text-[#0B1F14]"
          : disabled
            ? "cursor-not-allowed text-[#8D959D]/50"
            : "text-[#8D959D] hover:bg-white hover:text-[#0B1F14]"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  )
}
