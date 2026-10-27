//components/event-details-card.tsx
"use client"

import { useEffect, useState } from "react"
import { Edit2, MoreVertical, FileUp, Award, Download, BarChart3, Upload, UserPlus, Mail, Palette, Users, CheckCircle2, CreditCard, CalendarDays, Clock, MapPin, Plus, BookOpen, GraduationCap, Video, Trash2, X, Link2, Copy, ExternalLink, Mails, QrCode, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import type { Event } from "@/types/event"
import SendEvaluationsModal from "@/components/send-evaluation-modal"
import CertificateTemplateModal from "@/components/certificate-template-modal"
import ExportAttendeesModal from "@/components/export-attendees-modal"
import DownloadCertificatesModal from "@/components/download-certificates-modal"
import SendDirectCertificateModal from "@/components/send-direct-certificate-modal"
import AddAttendeeModal from "@/components/add-attendee-modal"
import EditEmailsModal from "@/components/edit-emails-modal"
import SendAttendeeEmailModal from "@/components/send-attendee-email-modal"
import { supabase } from "@/lib/supabase-client"
import { EventCoverCrop } from "@/components/event-cover-crop"
import { normalizeRegistrationSlug, normalizeSlugList, registrationPath } from "@/lib/event-slugs"

const EVENT_TYPES = [
  { value: "Conference", label: "Conference", icon: Users, tint: "bg-emerald-50 text-emerald-700" },
  { value: "Seminar", label: "Seminar", icon: BookOpen, tint: "bg-sky-50 text-sky-700" },
  { value: "Training", label: "Training", icon: GraduationCap, tint: "bg-amber-50 text-amber-700" },
  { value: "Webinar", label: "Webinar", icon: Video, tint: "bg-violet-50 text-violet-700" },
] as const

function dateInputValue(value?: string) {
  return value ? value.slice(0, 10) : ""
}

// Extended Event type with stats
type EventWithStats = Omit<Event, "attendees"> & {
  attendees: {
    registered: number
    attended: number
    paid: number
  }
}

export function EventDetailsCard({ event, onAttendeeAdded, onUpdated }: { event: EventWithStats; onAttendeeAdded?: () => void; onUpdated?: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEvent, setEditedEvent] = useState(event)
  const [topicInput, setTopicInput] = useState("")
  const [priceInput, setPriceInput] = useState(event.price ? String(event.price) : "")
  const [coverImage, setCoverImage] = useState(event.feature_image || "")
  const [registrationSlug, setRegistrationSlug] = useState(event.magic_link || "")
  const [slugAliases, setSlugAliases] = useState<string[]>(normalizeSlugList(event.magic_link_aliases))
  const [aliasInput, setAliasInput] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      setEditedEvent(event)
      setCoverImage(event.feature_image || "")
      setPriceInput(event.price ? String(event.price) : "")
      setRegistrationSlug(event.magic_link || "")
      setSlugAliases(normalizeSlugList(event.magic_link_aliases))
      setAliasInput("")
    }
  }, [event, isEditing])

  const startEditing = () => {
    setEditedEvent(event)
    setCoverImage(event.feature_image || "")
    setPriceInput(event.price ? String(event.price) : "")
    setRegistrationSlug(event.magic_link || "")
    setSlugAliases(normalizeSlugList(event.magic_link_aliases))
    setAliasInput("")
    setTopicInput("")
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setEditedEvent(event)
    setCoverImage(event.feature_image || "")
    setPriceInput(event.price ? String(event.price) : "")
    setRegistrationSlug(event.magic_link || "")
    setSlugAliases(normalizeSlugList(event.magic_link_aliases))
    setAliasInput("")
    setTopicInput("")
    setIsEditing(false)
  }

  const addAlias = () => {
    const next = normalizeRegistrationSlug(aliasInput)
    const primary = normalizeRegistrationSlug(registrationSlug)
    if (!next || next.length < 3) return
    if (next === primary || slugAliases.includes(next)) {
      setAliasInput("")
      return
    }
    setSlugAliases([...slugAliases, next])
    setAliasInput("")
  }

  const handleSave = async () => {
    if (!editedEvent.name.trim() || !editedEvent.venue.trim()) {
      alert("Event name and venue are required.")
      return
    }

    const slug = normalizeRegistrationSlug(registrationSlug)
    if (!slug || slug.length < 3) {
      alert("Enter a registration slug with at least 3 letters or numbers.")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: event.id,
          name: editedEvent.name,
          description: editedEvent.description,
          type: editedEvent.type,
          price: editedEvent.price,
          venue: editedEvent.venue,
          schedule: editedEvent.schedule,
          feature_image: coverImage,
          magic_link: slug,
          magic_link_aliases: slugAliases.filter((alias) => alias !== slug),
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save changes")
      }
      if (payload.warning) {
        alert(payload.warning)
      }
      setRegistrationSlug(slug)
      setSlugAliases(normalizeSlugList(payload.event?.magic_link_aliases || slugAliases))
      setIsEditing(false)
      onUpdated?.()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const [showSendEvaluationsModal, setShowSendEvaluationsModal] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showDownloadCertificatesModal, setShowDownloadCertificatesModal] = useState(false)
  const [showSendDirectCertificateModal, setShowSendDirectCertificateModal] = useState(false)
  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false)
  const [showEditEmailsModal, setShowEditEmailsModal] = useState(false)
  const [showSendQrModal, setShowSendQrModal] = useState(false)
  const [showSendEventInfoModal, setShowSendEventInfoModal] = useState(false)
  const [sendEmailsOpen, setSendEmailsOpen] = useState(false)

  const runAction = (label: string) => {
    if (label === "Open Registration") {
      if (!event.magic_link) {
        alert("This event doesn't have a registration link yet.")
        return
      }
      window.open(`/${event.magic_link}`, "_blank")
      return
    }
    if (label === "Edit Certificate Template") setShowTemplateEditor(true)
    if (label === "Edit Emails") setShowEditEmailsModal(true)
    if (label === "Send Evaluations") setShowSendEvaluationsModal(true)
    if (label === "Export Attendees") setShowExportModal(true)
    if (label === "Download Certificates") setShowDownloadCertificatesModal(true)
    if (label === "Send Direct Certificate") setShowSendDirectCertificateModal(true)
    if (label === "Add New Attendee") setShowAddAttendeeModal(true)
  }

  const primaryActions = [
    { label: "Open Registration", icon: ExternalLink, className: "bg-[#0B1F14] text-white hover:bg-[#163525]" },
    { label: "Add New Attendee", icon: UserPlus, className: "bg-[#00D47E] text-[#0B1F14] hover:bg-[#00c174]" },
    { label: "Export Attendees", icon: Download, className: "border border-[#017C7C]/30 bg-[#E8F5F5] text-[#017C7C] hover:bg-[#d7eeee]" },
  ]

  const emailActions = [
    { label: "Send direct certificate", icon: Award, run: () => setShowSendDirectCertificateModal(true) },
    { label: "Send evaluation", icon: Mail, run: () => setShowSendEvaluationsModal(true) },
    { label: "Resend QR code", icon: QrCode, run: () => setShowSendQrModal(true) },
    { label: "Send event info", icon: CalendarDays, run: () => setShowSendEventInfoModal(true) },
  ]

  const moreActions = [
    { label: "Edit Emails", icon: Mails },
    { label: "Edit Certificate Template", icon: Palette },
    { label: "Download Certificates", icon: Award },
    { label: "Download Badges", icon: FileUp },
    { label: "Show Evaluation Results", icon: BarChart3 },
    { label: "Upload Attendees", icon: Upload },
  ]

  const fieldClass =
    "w-full rounded-xl border border-[#E8EAEB] bg-white px-3 py-2.5 text-sm text-[#1E1E1E] outline-none focus-visible:border-[#00D47E] focus-visible:ring-2 focus-visible:ring-[#00D47E]/20"

  return (
    <Card className="h-full overflow-hidden rounded-2xl border border-[#E8EAEB] border-l-4 border-l-[#00D47E] bg-white shadow-sm">
      <CardHeader className="space-y-4 bg-[#F7FBF8]/80">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#017C7C]">Overview</p>
            <CardTitle className="text-lg text-[#0B1F14]">Event Details</CardTitle>
            <CardDescription className="mt-1 text-[#8D959D]">Info, links, and event tools</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => (isEditing ? cancelEditing() : startEditing())}
            className={`h-9 shrink-0 gap-2 rounded-xl px-3 font-medium ${
              isEditing
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border-[#00D47E]/40 bg-[#00D47E]/15 text-[#0B1F14] hover:bg-[#00D47E]/25"
            }`}
          >
            <Edit2 className="h-4 w-4" />
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </div>

        {!isEditing && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {primaryActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => runAction(action.label)}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                      primaryActions.length % 2 === 1 && index === primaryActions.length - 1 ? "col-span-2" : ""
                    } ${action.className}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{action.label}</span>
                  </button>
                )
              })}
            </div>
            <DropdownMenu onOpenChange={(open) => { if (!open) setSendEmailsOpen(false) }}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 w-full justify-between rounded-xl border-[#E8EAEB] bg-white font-medium text-[#1E1E1E] hover:bg-white">
                  <span className="inline-flex items-center gap-2">
                    <MoreVertical className="h-4 w-4 text-[#017C7C]" />
                    More tools
                  </span>
                  <span className="rounded-md bg-[#0B1F14] px-2 py-0.5 text-xs font-semibold text-white">{moreActions.length + 1}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem
                  className="cursor-pointer py-2.5"
                  onSelect={(event) => {
                    event.preventDefault()
                    setSendEmailsOpen((open) => !open)
                  }}
                >
                  <Mails className="mr-2 h-4 w-4" />
                  <span>Send emails</span>
                  <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${sendEmailsOpen ? "rotate-90" : ""}`} />
                </DropdownMenuItem>
                {sendEmailsOpen && (
                  <div className="mx-1 mb-1 space-y-0.5 rounded-lg bg-[#E8F5F5] p-1">
                    {emailActions.map((action) => {
                      const Icon = action.icon
                      return (
                        <DropdownMenuItem
                          key={action.label}
                          className="cursor-pointer rounded-md bg-[#E8F5F5] py-2.5 pl-7 text-[#017C7C] focus:bg-[#d7eeee] focus:text-[#017C7C]"
                          onClick={action.run}
                        >
                          <Icon className="mr-2 h-4 w-4 text-[#017C7C]" />
                          <span>{action.label}</span>
                        </DropdownMenuItem>
                      )
                    })}
                  </div>
                )}
                {moreActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <DropdownMenuItem key={action.label} className="cursor-pointer py-2.5" onClick={() => runAction(action.label)}>
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{action.label}</span>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Cover image</label>
                <EventCoverCrop value={coverImage} onChange={setCoverImage} />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Event Name</label>
                <input
                  type="text"
                  value={editedEvent.name}
                  onChange={(e) => setEditedEvent({ ...editedEvent, name: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Description</label>
                <Textarea
                  value={editedEvent.description || ""}
                  onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                  placeholder="Enter event description..."
                  className={`${fieldClass} min-h-[100px]`}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Event Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map((type) => {
                    const Icon = type.icon
                    const selected = editedEvent.type === type.value
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setEditedEvent({ ...editedEvent, type: type.value })}
                        className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                          selected
                            ? "border-[#00D47E] bg-[#00D47E]/10 text-[#0B1F14]"
                            : "border-[#E8EAEB] bg-white text-[#1E1E1E] hover:border-[#00D47E]/50"
                        }`}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${type.tint}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        {type.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Price</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#017C7C]">₱</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={priceInput}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return
                        setPriceInput(raw)
                        setEditedEvent({ ...editedEvent, price: raw === "" ? 0 : Number.parseFloat(raw) || 0 })
                      }}
                      placeholder="0.00"
                      className={`${fieldClass} pl-8`}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Venue</label>
                  <input
                    type="text"
                    value={editedEvent.venue}
                    onChange={(e) => setEditedEvent({ ...editedEvent, venue: e.target.value })}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                  Primary registration slug
                </label>
                <div className="overflow-hidden rounded-xl border border-[#E8EAEB] bg-white focus-within:border-[#00D47E] focus-within:ring-2 focus-within:ring-[#00D47E]/20">
                  <p className="border-b border-[#E8EAEB] bg-[#F7FBF8] px-3 py-2 font-mono text-[11px] text-[#8D959D]">
                    waspi.ph/
                  </p>
                  <input
                    type="text"
                    value={registrationSlug}
                    onChange={(e) => setRegistrationSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    onBlur={() => setRegistrationSlug(normalizeRegistrationSlug(registrationSlug))}
                    placeholder="natcon26"
                    className="w-full bg-transparent px-3 py-2.5 font-mono text-sm text-[#1E1E1E] outline-none"
                  />
                </div>
                <p className="mt-1.5 break-all text-xs text-[#8D959D]">
                  Public link: waspi.ph{registrationPath(normalizeRegistrationSlug(registrationSlug) || "natcon26")}
                </p>

                <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                  Extra slug links
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addAlias()
                      }
                    }}
                    placeholder="natcon2026"
                    className={fieldClass}
                  />
                  <Button
                    type="button"
                    onClick={addAlias}
                    className="h-11 rounded-xl bg-[#0B1F14] px-4 text-white hover:bg-[#0B1F14]/90"
                  >
                    Add
                  </Button>
                </div>
                <p className="mt-1.5 text-xs text-[#8D959D]">
                  Add alternate links for social posts or emails. They all open this same event.
                </p>
                {slugAliases.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {slugAliases.map((alias) => (
                      <span
                        key={alias}
                        className="inline-flex items-center gap-1 rounded-full bg-[#00D47E]/15 px-3 py-1 text-sm font-medium text-[#0B1F14]"
                      >
                        waspi.ph/{alias}
                        <button
                          type="button"
                          onClick={() => setSlugAliases(slugAliases.filter((item) => item !== alias))}
                          aria-label={`Remove ${alias}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-[#E8EAEB] bg-white p-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#1E1E1E]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    Schedule
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setEditedEvent({
                        ...editedEvent,
                        schedule: [
                          ...(editedEvent.schedule || []),
                          { date: "", timeIn: "09:00", timeOut: "17:00", coveredTopics: [] },
                        ],
                      })
                    }
                    className="h-8 rounded-full border-[#E8EAEB] text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add day
                  </Button>
                </div>
                {(editedEvent.schedule || []).map((sched, index) => (
                  <div key={index} className="rounded-2xl bg-[#F7FBF8] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">Day {index + 1}</p>
                      {(editedEvent.schedule || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditedEvent({
                              ...editedEvent,
                              schedule: editedEvent.schedule.filter((_, i) => i !== index),
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs text-[#8D959D]">
                          <CalendarDays className="h-3 w-3" /> Date
                        </label>
                        <input
                          type="date"
                          value={dateInputValue(sched.date)}
                          onChange={(e) => {
                            const updated = [...editedEvent.schedule]
                            updated[index] = { ...updated[index], date: e.target.value }
                            setEditedEvent({ ...editedEvent, schedule: updated })
                          }}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs text-[#8D959D]">
                          <Clock className="h-3 w-3" /> Start
                        </label>
                        <input
                          type="time"
                          value={sched.timeIn}
                          onChange={(e) => {
                            const updated = [...editedEvent.schedule]
                            updated[index] = { ...updated[index], timeIn: e.target.value }
                            setEditedEvent({ ...editedEvent, schedule: updated })
                          }}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs text-[#8D959D]">
                          <Clock className="h-3 w-3" /> End
                        </label>
                        <input
                          type="time"
                          value={sched.timeOut}
                          onChange={(e) => {
                            const updated = [...editedEvent.schedule]
                            updated[index] = { ...updated[index], timeOut: e.target.value }
                            setEditedEvent({ ...editedEvent, schedule: updated })
                          }}
                          className={fieldClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-2xl border border-[#E8EAEB] bg-white p-3">
                <label className="text-sm font-semibold text-[#1E1E1E]">Covered Topics</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a topic"
                    className={fieldClass}
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return
                      e.preventDefault()
                      if (!topicInput.trim() || editedEvent.schedule.length === 0) return
                      const newSchedule = [...editedEvent.schedule]
                      newSchedule[0] = {
                        ...newSchedule[0],
                        coveredTopics: [...(newSchedule[0].coveredTopics || []), topicInput.trim()],
                      }
                      setEditedEvent({ ...editedEvent, schedule: newSchedule })
                      setTopicInput("")
                    }}
                  />
                  <Button
                    size="sm"
                    type="button"
                    className="h-10 rounded-xl bg-[#0B1F14] text-white hover:bg-[#0B1F14]/90"
                    onClick={() => {
                      if (!topicInput.trim() || editedEvent.schedule.length === 0) return
                      const newSchedule = [...editedEvent.schedule]
                      newSchedule[0] = {
                        ...newSchedule[0],
                        coveredTopics: [...(newSchedule[0].coveredTopics || []), topicInput.trim()],
                      }
                      setEditedEvent({ ...editedEvent, schedule: newSchedule })
                      setTopicInput("")
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editedEvent.schedule?.[0]?.coveredTopics?.map((topic, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-[#00D47E]/15 px-3 py-1 text-sm font-medium text-[#0B1F14]"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => {
                          const newSchedule = [...editedEvent.schedule]
                          newSchedule[0] = {
                            ...newSchedule[0],
                            coveredTopics: newSchedule[0].coveredTopics.filter((_, i) => i !== index),
                          }
                          setEditedEvent({ ...editedEvent, schedule: newSchedule })
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="h-11 flex-1 rounded-full border-[#E8EAEB]"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="h-11 flex-1 rounded-full bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Registered", value: event.attendees.registered, icon: Users, wrap: "bg-sky-50 border-sky-200", iconClass: "text-sky-600", labelClass: "text-sky-700" },
                  { label: "Attended", value: event.attendees.attended, icon: CheckCircle2, wrap: "bg-emerald-50 border-emerald-200", iconClass: "text-emerald-600", labelClass: "text-emerald-700" },
                  { label: "Paid", value: event.attendees.paid, icon: CreditCard, wrap: "bg-amber-50 border-amber-200", iconClass: "text-amber-600", labelClass: "text-amber-700" },
                ].map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className={`rounded-xl border px-3 py-3 ${stat.wrap}`}>
                      <Icon className={`mb-1 h-3.5 w-3.5 ${stat.iconClass}`} />
                      <p className="text-xl font-semibold tabular-nums text-[#0B1F14]">{stat.value}</p>
                      <p className={`text-[11px] font-semibold ${stat.labelClass}`}>{stat.label}</p>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">Type</p>
                    <p className="mt-1 font-semibold text-violet-950">{editedEvent.type}</p>
                  </div>
                  <div className="rounded-xl border border-[#017C7C]/25 bg-[#E8F5F5] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#017C7C]">Price</p>
                    <p className="mt-1 font-semibold text-[#017C7C]">₱{editedEvent.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-[#00D47E]/35 bg-[#00D47E]/10 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#0B1F14]/70">
                    <MapPin className="h-3.5 w-3.5 text-[#00D47E]" />
                    Venue
                  </p>
                  <p className="mt-1 font-semibold text-[#0B1F14]">{editedEvent.venue}</p>
                </div>
              </div>

              <section className="overflow-hidden rounded-xl border border-[#017C7C]/25">
                <div className="flex items-center justify-between bg-[#017C7C] px-4 py-2.5">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Link2 className="h-4 w-4" />
                    Registration links
                  </p>
                </div>
                <div className="divide-y divide-[#E8EAEB] bg-white p-2">
                  {editedEvent.magic_link ? (
                    [editedEvent.magic_link, ...normalizeSlugList(editedEvent.magic_link_aliases)].map((slug, index) => (
                      <div key={slug} className="flex items-center gap-2 rounded-lg px-2 py-2.5 hover:bg-[#E8F5F5]">
                        <div className="min-w-0 flex-1">
                          <p className={`text-[10px] font-semibold uppercase tracking-wide ${index === 0 ? "text-[#017C7C]" : "text-amber-700"}`}>
                            {index === 0 ? "Primary" : "Extra"}
                          </p>
                          <a
                            href={registrationPath(slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all font-mono text-sm font-semibold text-[#017C7C] hover:underline"
                          >
                            waspi.ph{registrationPath(slug)}
                          </a>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 shrink-0 gap-1.5 rounded-lg bg-[#00D47E] px-3 font-semibold text-[#0B1F14] hover:bg-[#00c174]"
                          onClick={async () => {
                            const full = `${window.location.origin}${registrationPath(slug)}`
                            await navigator.clipboard.writeText(full)
                            alert("Registration link copied")
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="px-2 py-3 text-sm text-[#8D959D]">No registration slug yet. Edit the event to set one.</p>
                  )}
                </div>
              </section>

              {editedEvent.description && (
                <section className="rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">Description</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#1E1E1E]">{editedEvent.description}</p>
                </section>
              )}

              {editedEvent.feature_image && (
                <img
                  src={editedEvent.feature_image}
                  alt=""
                  className="aspect-[1200/628] w-full rounded-xl border border-[#E8EAEB] object-cover"
                />
              )}

              <section className="overflow-hidden rounded-xl border border-[#0B1F14]/15">
                <div className="flex items-center gap-2 bg-[#0B1F14] px-4 py-2.5">
                  <CalendarDays className="h-4 w-4 text-[#00D47E]" />
                  <p className="text-sm font-semibold text-white">Schedule</p>
                </div>
                {editedEvent.schedule && editedEvent.schedule.length > 0 ? (
                  <ol className="divide-y divide-[#E8EAEB] bg-white">
                    {editedEvent.schedule.map((sched, index) => (
                      <li key={index} className="flex items-start gap-3 px-4 py-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00D47E] text-xs font-bold text-[#0B1F14]">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1E1E1E]">
                            {dateInputValue(sched.date)
                              ? new Date(dateInputValue(sched.date) + "T12:00:00").toLocaleDateString(undefined, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "No date"}
                          </p>
                          {(sched.timeIn || sched.timeOut) && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#017C7C]">
                              <Clock className="h-3 w-3" />
                              {sched.timeIn || "—"} – {sched.timeOut || "—"}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="bg-white px-4 py-4 text-sm text-[#8D959D]">No schedule available</p>
                )}
              </section>

              <section className="rounded-xl border border-[#00D47E]/30 bg-[#F7FBF8] px-4 py-3">
                <p className="text-sm font-semibold text-[#0B1F14]">Covered Topics</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {editedEvent.schedule?.[0]?.coveredTopics?.length ? (
                    editedEvent.schedule[0].coveredTopics.map((topic, i) => (
                      <span
                        key={topic}
                        className={`rounded-md border px-2.5 py-1 text-sm font-medium ${
                          i % 3 === 0
                            ? "border-[#00D47E]/40 bg-[#00D47E]/15 text-[#0B1F14]"
                            : i % 3 === 1
                              ? "border-[#017C7C]/30 bg-[#E8F5F5] text-[#017C7C]"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {topic}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-[#8D959D]">No topics yet</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </CardContent>

      <SendEvaluationsModal
        eventId={Number(event.id)}
        open={showSendEvaluationsModal}
        onClose={() => setShowSendEvaluationsModal(false)}
        supabase={supabase}
      />

      <CertificateTemplateModal
        eventId={Number(event.id)}
        open={showTemplateEditor}
        onClose={() => setShowTemplateEditor(false)}
      />

      <ExportAttendeesModal
        eventId={Number(event.id)}
        eventName={event.name}
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <DownloadCertificatesModal
        eventId={Number(event.id)}
        eventName={event.name}
        open={showDownloadCertificatesModal}
        onClose={() => setShowDownloadCertificatesModal(false)}
      />

      <SendDirectCertificateModal
        eventId={Number(event.id)}
        eventName={event.name}
        scheduleDates={editedEvent.schedule || []}
        open={showSendDirectCertificateModal}
        onClose={() => setShowSendDirectCertificateModal(false)}
      />

      <AddAttendeeModal
        eventId={Number(event.id)}
        eventName={event.name}
        open={showAddAttendeeModal}
        onClose={() => setShowAddAttendeeModal(false)}
        onAttendeeAdded={onAttendeeAdded}
      />

      <EditEmailsModal
        eventId={Number(event.id)}
        eventName={event.name}
        open={showEditEmailsModal}
        onClose={() => setShowEditEmailsModal(false)}
      />

      <SendAttendeeEmailModal
        eventId={Number(event.id)}
        open={showSendQrModal}
        onClose={() => setShowSendQrModal(false)}
        title="Resend QR code"
        description="Each person gets a QR labeled with their own name. Two people who share an old code still check in separately."
        actionLabel="Send QR codes"
        kind="qr"
      />

      <SendAttendeeEmailModal
        eventId={Number(event.id)}
        open={showSendEventInfoModal}
        onClose={() => setShowSendEventInfoModal(false)}
        title="Send event info"
        description="Sends the venue, agenda, and a QR code issued to that attendee."
        actionLabel="Send event info"
        kind="event_info"
      />
    </Card>
  )
}