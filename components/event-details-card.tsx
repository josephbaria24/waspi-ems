//components/event-details-card.tsx
"use client"

import { useState } from "react"
import { Edit2, MoreVertical, FileUp, Award, Download, BarChart3, Upload, UserPlus, Mail, Palette, Users, CheckCircle2, CreditCard, CalendarDays, Clock, MapPin, Plus } from "lucide-react"
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

// Extended Event type with stats
type EventWithStats = Omit<Event, "attendees"> & {
  attendees: {
    registered: number
    attended: number
    paid: number
  }
}

export function EventDetailsCard({ event, onAttendeeAdded }: { event: EventWithStats; onAttendeeAdded?: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEvent, setEditedEvent] = useState(event)
  const [topicInput, setTopicInput] = useState("")

  const handleSave = async () => {
    const { error } = await supabase
      .from('events')
      .update({
        name: editedEvent.name,
        venue: editedEvent.venue,
        price: editedEvent.price,
        description: editedEvent.description
      })
      .eq('id', event.id)

    if (error) {
      console.error('Error updating event:', error)
      alert('Failed to save changes')
    } else {
      setIsEditing(false)
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
          <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)} className="rounded-full border-[#E8EAEB]">
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
                        window.open(`/register?ref=${event.magic_link}`, "_blank")
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
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Venue</label>
                <input
                  type="text"
                  value={editedEvent.venue}
                  onChange={(e) => setEditedEvent({ ...editedEvent, venue: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Price</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#017C7C]">₱</span>
                  <input
                    type="number"
                    value={editedEvent.price}
                    onChange={(e) => setEditedEvent({ ...editedEvent, price: Number.parseFloat(e.target.value) || 0 })}
                    className={`${fieldClass} pl-8`}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedEvent(event)
                    setIsEditing(false)
                  }}
                  className="h-11 flex-1 rounded-full border-[#E8EAEB]"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} className="h-11 flex-1 rounded-full bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]">
                  Save Changes
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

              {editedEvent.description && (
                <div className="rounded-2xl border border-[#E8EAEB] bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#1E1E1E]">{editedEvent.description}</p>
                </div>
              )}

              {editedEvent.schedule && editedEvent.schedule.length > 0 ? (
                <div className="space-y-3 rounded-2xl border border-[#E8EAEB] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-semibold text-[#1E1E1E]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <CalendarDays className="h-4 w-4" />
                      </span>
                      Schedule
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditedEvent({
                          ...editedEvent,
                          schedule: [
                            ...editedEvent.schedule,
                            {
                              date: "",
                              timeIn: "",
                              timeOut: "",
                              coveredTopics: [],
                            },
                          ],
                        })
                      }
                      className="h-8 rounded-full border-[#E8EAEB] text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add day
                    </Button>
                  </div>
                  {editedEvent.schedule.map((sched, index) => (
                    <div key={index} className="rounded-2xl bg-[#F7FBF8] p-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">Day {index + 1}</p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 flex items-center gap-1 text-xs text-[#8D959D]">
                            <CalendarDays className="h-3 w-3" /> Date
                          </label>
                          <input
                            type="date"
                            value={sched.date}
                            onChange={(e) => {
                              const updated = [...editedEvent.schedule]
                              updated[index].date = e.target.value
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
                              updated[index].timeIn = e.target.value
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
                              updated[index].timeOut = e.target.value
                              setEditedEvent({ ...editedEvent, schedule: updated })
                            }}
                            className={fieldClass}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#CDEEDD] bg-[#F7FBF8] px-4 py-4">
                  <p className="text-sm text-[#8D959D]">No schedule available</p>
                </div>
              )}

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
                      if (e.key === "Enter") {
                        e.preventDefault()
                        if (editedEvent.schedule.length === 0) return
                        const newSchedule = [...editedEvent.schedule]
                        newSchedule[0].coveredTopics.push(topicInput.trim())
                        setEditedEvent({ ...editedEvent, schedule: newSchedule })
                        setTopicInput("")
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    type="button"
                    className="h-10 rounded-xl bg-[#0B1F14] text-white hover:bg-[#0B1F14]/90"
                    onClick={() => {
                      if (editedEvent.schedule.length === 0) return
                      const newSchedule = [...editedEvent.schedule]
                      newSchedule[0].coveredTopics.push(topicInput.trim())
                      setEditedEvent({ ...editedEvent, schedule: newSchedule })
                      setTopicInput("")
                    }}
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {editedEvent.schedule.length > 0 && editedEvent.schedule[0].coveredTopics?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {editedEvent.schedule[0].coveredTopics.map((topic, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-[#00D47E]/15 px-3 py-1 text-sm font-medium text-[#0B1F14]"
                        >
                          {topic}
                          <button
                            type="button"
                            onClick={() => {
                              const newSchedule = [...editedEvent.schedule]
                              newSchedule[0].coveredTopics = newSchedule[0].coveredTopics.filter((_, i) => i !== index)
                              setEditedEvent({ ...editedEvent, schedule: newSchedule })
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
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