"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Loader2, Search, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase-client"
import { EmailStatusTags } from "@/components/email-status-tags"
import type { EmailStatus } from "@/lib/email-status"
import { mergeEmailStatus, readLocalEmailStatus, rememberEmailStatus } from "@/lib/email-status"

type Attendee = {
  id: number
  personal_name: string
  middle_name: string | null
  last_name: string
  email: string
  hassentevaluation?: boolean
  email_status?: EmailStatus | null
}

type SendResult = {
  successful: Array<{ id: number; name: string; email: string }>
  failed: Array<{ id: number; name: string; email: string; error: string }>
}

type Props = {
  open: boolean
  onClose: () => void
  eventId: number
  title: string
  description: string
  actionLabel: string
  kind: "qr" | "event_info"
}

export default function SendAttendeeEmailModal({
  open,
  onClose,
  eventId,
  title,
  description,
  actionLabel,
  kind,
}: Props) {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedIds(new Set())
    setSearchQuery("")
    setResult(null)
    const load = async () => {
      setLoading(true)
      const columns = "id, personal_name, middle_name, last_name, email, hassentevaluation, email_status"
      let { data, error } = await supabase
        .from("attendees")
        .select(columns)
        .eq("event_id", eventId)
        .order("last_name", { ascending: true })
      if (error) {
        const retry = await supabase
          .from("attendees")
          .select("id, personal_name, middle_name, last_name, email, hassentevaluation")
          .eq("event_id", eventId)
          .order("last_name", { ascending: true })
        data = retry.data
      }
      const local = readLocalEmailStatus()
      if (data) {
        setAttendees(
          data.map((attendee) => ({
            ...attendee,
            email_status: mergeEmailStatus(local[String(attendee.id)], attendee.email_status),
          })),
        )
      }
      setLoading(false)
    }
    load()
  }, [open, eventId])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return attendees
    return attendees.filter((attendee) => {
      const name = `${attendee.personal_name || ""} ${attendee.middle_name || ""} ${attendee.last_name || ""}`.toLowerCase()
      return name.includes(query) || (attendee.email || "").toLowerCase().includes(query)
    })
  }, [attendees, searchQuery])

  const allSelected = filtered.length > 0 && filtered.every((attendee) => selectedIds.has(attendee.id))

  const toggleAll = () => {
    const next = new Set(selectedIds)
    if (allSelected) filtered.forEach((attendee) => next.delete(attendee.id))
    else filtered.forEach((attendee) => next.add(attendee.id))
    setSelectedIds(next)
  }

  const toggleOne = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const send = async () => {
    if (selectedIds.size === 0 || sending) return
    setSending(true)
    setResult(null)
    try {
      const response = await fetch("/api/send-attendee-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          attendeeIds: Array.from(selectedIds),
          kind,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to send emails")
      const sent = new Set((data.result?.successful || []).map((item: { id: number }) => item.id))
      const patch: EmailStatus = kind === "qr" ? { qr: true, qr_resent: true } : { event_info: true }
      rememberEmailStatus(Array.from(sent), patch)
      setAttendees((current) =>
        current.map((attendee) => {
          if (!sent.has(attendee.id)) return attendee
          return { ...attendee, email_status: mergeEmailStatus(attendee.email_status, patch) }
        }),
      )
      setResult(data.result || { successful: [], failed: [] })
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to send emails")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !sending && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-hidden rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D959D]" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name or email"
            className="pl-9"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <button type="button" onClick={toggleAll} className="font-semibold text-[#017C7C]">
            {allSelected ? "Clear shown" : "Select shown"}
          </button>
          <span className="text-[#8D959D]">{selectedIds.size} selected</span>
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-[#E8EAEB] p-2">
          {loading ? (
            <p className="px-2 py-6 text-center text-sm text-[#8D959D]">Loading attendees...</p>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-[#8D959D]">No attendees found</p>
          ) : (
            filtered.map((attendee) => {
              const name = [attendee.personal_name, attendee.middle_name, attendee.last_name].filter(Boolean).join(" ")
              return (
                <label
                  key={attendee.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#F7FBF8]"
                >
                  <Checkbox checked={selectedIds.has(attendee.id)} onCheckedChange={() => toggleOne(attendee.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#1E1E1E]">{name}</span>
                    <span className="block truncate text-xs text-[#8D959D]">{attendee.email}</span>
                    <EmailStatusTags status={attendee.email_status} evaluated={attendee.hassentevaluation} />
                  </span>
                </label>
              )
            })
          )}
        </div>

        {result && (
          <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl bg-[#F7FBF8] p-3 text-sm">
            <p className="font-semibold text-[#0B1F14]">
              {result.successful.length} sent
              {result.failed.length > 0 ? `, ${result.failed.length} failed` : ""}
            </p>
            {result.failed.map((item) => (
              <p key={item.id} className="flex items-start gap-2 text-red-700">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {item.name}: {item.error}
                </span>
              </p>
            ))}
            {result.successful.slice(0, 5).map((item) => (
              <p key={item.id} className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </p>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={sending} className="rounded-xl">
            Close
          </Button>
          <Button
            type="button"
            onClick={send}
            disabled={sending || selectedIds.size === 0}
            className="rounded-xl bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {sending ? "Sending..." : actionLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
