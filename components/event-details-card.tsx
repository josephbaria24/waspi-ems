//components/event-details-card.tsx
"use client"

import { useEffect, useState } from "react"
import { Edit2, MoreVertical, FileUp, Award, Download, BarChart3, Upload, UserPlus, Mail, Palette, Users, CheckCircle2, CreditCard, CalendarDays, Clock, MapPin, Plus, BookOpen, GraduationCap, Video, Trash2, X, Link2, Copy } from "lucide-react"
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

  const actions = [
    { label: "Add New Attendee", icon: UserPlus },
    { label: "Open Registration", icon: UserPlus },
    { label: "Edit Certificate Template", icon: Palette },
    { label: "Send Evaluations", icon: Mail },
    { label: "Send Direct Certificate", icon: Award },
    { label: "Export Attendees", icon: Download },
    { label: "Download Certificates", icon: Award },
    { label: "Download Badges", icon: FileUp },
    { label: "Show Evaluation Results", icon: BarChart3 },
    { label: "Upload Attendees", icon: Upload },
  ]

  const fieldClass =
    "w-full rounded-xl border border-[#E8EAEB] bg-white px-3 py-2.5 text-sm text-[#1E1E1E] outline-none focus-visible:border-[#00D47E] focus-visible:ring-2 focus-visible:ring-[#00D47E]/20"

  return (
    <Card className="rounded-2xl border border-[#E8EAEB] bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-[#1E1E1E]">Event Details</CardTitle>
          <CardDescription className="text-[#8D959D]">Manage event information</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => (isEditing ? cancelEditing() : startEditing())} className="rounded-full border-[#E8EAEB]">
            <Edit2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full border-[#E8EAEB] bg-transparent">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <DropdownMenuItem
                    key={action.label}
                    className="cursor-pointer"
                    onClick={async () => {
                      if (action.label === "Open Registration") {
                        if (!event.magic_link) {
                          alert("⚠️ This event doesn't have a registration link yet.")
                          return
                        }
                        window.open(`/${event.magic_link}`, "_blank")
                      }
                      if (action.label === "Edit Certificate Template") {
                        setShowTemplateEditor(true)
                      }
                      if (action.label === "Send Evaluations") {
                        setShowSendEvaluationsModal(true)
                      }
                      if (action.label === "Export Attendees") {
                        setShowExportModal(true)
                      }
                      if (action.label === "Download Certificates") {
                        setShowDownloadCertificatesModal(true)
                      }
                      if (action.label === "Send Direct Certificate") {
                        setShowSendDirectCertificateModal(true)
                      }
                      if (action.label === "Add New Attendee") {
                        setShowAddAttendeeModal(true)
                      }
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4 hover:text-white" />
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-sky-50 px-3 py-3 text-center">
                  <Users className="mx-auto mb-1 h-4 w-4 text-sky-700" />
                  <p className="text-xl font-semibold text-[#1E1E1E]">{event.attendees.registered}</p>
                  <p className="text-[11px] text-sky-700">Registered</p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-3 py-3 text-center">
                  <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-emerald-700" />
                  <p className="text-xl font-semibold text-[#1E1E1E]">{event.attendees.attended}</p>
                  <p className="text-[11px] text-emerald-700">Attended</p>
                </div>
                <div className="rounded-xl bg-amber-50 px-3 py-3 text-center">
                  <CreditCard className="mx-auto mb-1 h-4 w-4 text-amber-700" />
                  <p className="text-xl font-semibold text-[#1E1E1E]">{event.attendees.paid}</p>
                  <p className="text-[11px] text-amber-700">Paid</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E8EAEB] bg-[#F7FBF8] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">Type</p>
                  <p className="mt-1 font-semibold text-[#1E1E1E]">{editedEvent.type}</p>
                </div>
                <div className="rounded-2xl border border-[#E8EAEB] bg-[#F7FBF8] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">Price</p>
                  <p className="mt-1 font-semibold text-[#017C7C]">₱{editedEvent.price.toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8EAEB] bg-white p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">
                  <MapPin className="h-3.5 w-3.5 text-[#017C7C]" />
                  Venue
                </p>
                <p className="mt-1 font-semibold text-[#1E1E1E]">{editedEvent.venue}</p>
              </div>

              <div className="rounded-2xl border border-[#E8EAEB] bg-white p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">
                  <Link2 className="h-3.5 w-3.5 text-[#017C7C]" />
                  Registration links
                </p>
                {editedEvent.magic_link ? (
                  <div className="mt-2 space-y-2">
                    {[editedEvent.magic_link, ...normalizeSlugList(editedEvent.magic_link_aliases)].map((slug, index) => (
                      <div key={slug} className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          {index === 0 && <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8D959D]">Primary</p>}
                          {index > 0 && <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8D959D]">Extra</p>}
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
                          variant="outline"
                          size="sm"
                          className="h-8 shrink-0 rounded-full border-[#E8EAEB] px-2.5"
                          onClick={async () => {
                            const full = `${window.location.origin}${registrationPath(slug)}`
                            await navigator.clipboard.writeText(full)
                            alert("Registration link copied")
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-[#8D959D]">No registration slug yet. Edit the event to set one.</p>
                )}
              </div>

              {editedEvent.description && (
                <div className="rounded-2xl border border-[#E8EAEB] bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#1E1E1E]">{editedEvent.description}</p>
                </div>
              )}

              {editedEvent.feature_image && (
                <img
                  src={editedEvent.feature_image}
                  alt=""
                  className="aspect-[1200/628] w-full rounded-2xl border border-[#E8EAEB] object-cover"
                />
              )}

              {editedEvent.schedule && editedEvent.schedule.length > 0 ? (
                <div className="space-y-3 rounded-2xl border border-[#E8EAEB] bg-white p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#1E1E1E]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    Schedule
                  </p>
                  {editedEvent.schedule.map((sched, index) => (
                    <div key={index} className="rounded-2xl bg-[#F7FBF8] p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">Day {index + 1}</p>
                      <p className="mt-1 text-sm font-semibold text-[#1E1E1E]">
                        {dateInputValue(sched.date) || "No date"}
                        {sched.timeIn || sched.timeOut ? ` · ${sched.timeIn || "—"} – ${sched.timeOut || "—"}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#CDEEDD] bg-[#F7FBF8] px-4 py-4">
                  <p className="text-sm text-[#8D959D]">No schedule available</p>
                </div>
              )}

              <div className="space-y-2 rounded-2xl border border-[#E8EAEB] bg-white p-3">
                <p className="text-sm font-semibold text-[#1E1E1E]">Covered Topics</p>
                <div className="flex flex-wrap gap-2">
                  {editedEvent.schedule?.[0]?.coveredTopics?.length ? (
                    editedEvent.schedule[0].coveredTopics.map((topic) => (
                      <span key={topic} className="rounded-full bg-[#00D47E]/15 px-3 py-1 text-sm font-medium text-[#0B1F14]">
                        {topic}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-[#8D959D]">No topics yet</p>
                  )}
                </div>
              </div>

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
    </Card>
  )
}