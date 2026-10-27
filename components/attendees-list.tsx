// Optimized AttendeesList with Quick Actions + Email Confirmation + Roles
"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Calendar, Search, Pencil, Clock, TrendingUp, CheckCircle2, Zap, X, Mail, Send, AlertCircle, Users, Mic, UserCircle, Trash2, CircleDollarSign, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase-client"
import { attendanceMatchesDate, scheduleDateEpoch } from "@/lib/attendance-date"

interface Attendee {
  id: number
  name: string
  email: string
  attendance: { date: number; status: string }[]
  personal_name: string
  middle_name?: string
  last_name: string
  mobile_number?: string
  date_of_birth?: string
  address?: string
  company?: string
  position?: string
  company_address?: string
  payment_status?: string
  reference_id?: string
  roles?: string[]
}

interface EventScheduleDate {
  date: string // ISO format e.g. "2025-11-06"
}

type QuickActionMode =
  | "payment"
  | "attendance"
  | "email"
  | "organizer"
  | "speaker"
  | "attendee"
  | "paying"
  | "non-paying"
  | "delete"
  | null

interface EmailResult {
  name: string
  email: string
  status: "success" | "error" | "skipped"
  error?: string
}

export function AttendeesList({ eventId, scheduleDates, refreshKey }: { eventId: string; scheduleDates: EventScheduleDate[]; refreshKey?: number }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null)
  const [editForm, setEditForm] = useState<Partial<Attendee>>({})
  const [saving, setSaving] = useState(false)

  // Quick Actions State
  const [quickActionMode, setQuickActionMode] = useState<QuickActionMode>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")

  // Email Sending State
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [emailProgress, setEmailProgress] = useState({ current: 0, total: 0 })
  const [emailResults, setEmailResults] = useState<EmailResult[]>([])
  const [showEmailResults, setShowEmailResults] = useState(false)

  useEffect(() => {
    const fetchAttendees = async () => {
      const { data, error } = await supabase
        .from("attendees")
        .select("*")
        .eq("event_id", parseInt(eventId))

      if (data) {
        setAttendees(
          data.map((a: any) => ({
            id: a.id,
            name: `${a.personal_name ?? ""} ${a.last_name ?? ""}`.trim(),
            email: a.email ?? "",
            attendance: a.attendance || [],
            personal_name: a.personal_name,
            middle_name: a.middle_name,
            last_name: a.last_name,
            mobile_number: a.mobile_number,
            date_of_birth: a.date_of_birth,
            address: a.address,
            company: a.company,
            position: a.position,
            company_address: a.company_address,
            payment_status: a.payment_status || "Pending",
            reference_id: a.reference_id,
            roles: a.roles || []
          }))
        )
      }
    }

    fetchAttendees()
  }, [eventId, refreshKey])

  // Exempt from payment tracking: Organizer, Speaker, or tagged Non-Paying
  const isPaymentExempt = useCallback((roles?: string[]) => {
    if (!roles || roles.length === 0) return false
    return roles.includes("Organizer") || roles.includes("Speaker") || roles.includes("Non-Paying")
  }, [])

  const applyRoleTag = (currentRoles: string[], roleToAdd: string) => {
    let next = currentRoles.includes(roleToAdd)
      ? currentRoles
      : [...currentRoles, roleToAdd]

    // Paying / Non-Paying are mutually exclusive tags
    if (roleToAdd === "Paying") {
      next = next.filter((r) => r !== "Non-Paying")
    } else if (roleToAdd === "Non-Paying") {
      next = next.filter((r) => r !== "Paying")
    }

    return next
  }

  const toggleAttendance = async (attendeeId: number, isoDate: string) => {
    const epochDate = scheduleDateEpoch(isoDate)

    const attendee = attendees.find((a) => a.id === attendeeId)
    if (!attendee) return

    const current = attendee.attendance.find((a) => attendanceMatchesDate(a.date, isoDate))
    let updatedAttendance = attendee.attendance.filter((a) => !attendanceMatchesDate(a.date, isoDate))

    if (!current) {
      updatedAttendance.push({ date: epochDate, status: "Present" })
    } else if (current.status === "Present") {
      updatedAttendance.push({ date: epochDate, status: "Absent" })
    }

    await supabase
      .from("attendees")
      .update({ attendance: updatedAttendance })
      .eq("id", attendeeId)

    setAttendees((prev) =>
      prev.map((a) =>
        a.id === attendeeId ? { ...a, attendance: updatedAttendance } : a
      )
    )
  }

  const updatePaymentStatus = async (attendeeId: number, status: string) => {
    const { error } = await supabase
      .from("attendees")
      .update({ payment_status: status })
      .eq("id", attendeeId)

    if (!error) {
      setAttendees((prev) =>
        prev.map((a) =>
          a.id === attendeeId ? { ...a, payment_status: status } : a
        )
      )
    }
  }

  const toggleRole = async (attendeeId: number, role: string) => {
    const attendee = attendees.find(a => a.id === attendeeId)
    if (!attendee) return

    const currentRoles = attendee.roles || []
    const updatedRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : applyRoleTag(currentRoles, role)

    const { error } = await supabase
      .from("attendees")
      .update({ roles: updatedRoles })
      .eq("id", attendeeId)

    if (!error) {
      setAttendees((prev) =>
        prev.map((a) =>
          a.id === attendeeId ? { ...a, roles: updatedRoles } : a
        )
      )
    }
  }

  const handleEditClick = (attendee: Attendee) => {
    setEditingAttendee(attendee)
    setEditForm({
      personal_name: attendee.personal_name,
      middle_name: attendee.middle_name,
      last_name: attendee.last_name,
      email: attendee.email,
      mobile_number: attendee.mobile_number,
      date_of_birth: attendee.date_of_birth,
      address: attendee.address,
      company: attendee.company,
      position: attendee.position,
      company_address: attendee.company_address
    })
  }

  const handleSaveEdit = async () => {
    if (!editingAttendee) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("attendees")
        .update({
          personal_name: editForm.personal_name,
          middle_name: editForm.middle_name,
          last_name: editForm.last_name,
          email: editForm.email,
          mobile_number: editForm.mobile_number,
          date_of_birth: editForm.date_of_birth,
          address: editForm.address,
          company: editForm.company,
          position: editForm.position,
          company_address: editForm.company_address
        })
        .eq("id", editingAttendee.id)

      if (!error) {
        setAttendees((prev) =>
          prev.map((a) =>
            a.id === editingAttendee.id
              ? {
                ...a,
                ...editForm,
                name: `${editForm.personal_name} ${editForm.last_name}`.trim()
              }
              : a
          )
        )
        setEditingAttendee(null)
        alert("✅ Attendee updated successfully!")
      } else {
        alert("❌ Failed to update attendee")
      }
    } catch (error) {
      console.error("Error updating attendee:", error)
      alert("❌ Failed to update attendee")
    } finally {
      setSaving(false)
    }
  }

  // Email Validation
  const isValidEmail = (email: string): boolean => {
    const trimmed = email.trim()
    if (!trimmed || trimmed !== email) return false
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(trimmed)
  }

  // Send Confirmation Emails
  const sendConfirmationEmails = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one attendee")
      return
    }

    const selectedAttendees = attendees.filter(a => selectedIds.includes(a.id))
    const results: EmailResult[] = []

    setIsSendingEmails(true)
    setEmailProgress({ current: 0, total: selectedAttendees.length })
    setEmailResults([])

    const eventName = "Event Name" // TODO: Pass as prop
    const venue = "Event Venue" // TODO: Pass as prop

    for (let i = 0; i < selectedAttendees.length; i++) {
      const attendee = selectedAttendees[i]

      if (!isValidEmail(attendee.email)) {
        results.push({
          name: attendee.name,
          email: attendee.email,
          status: "skipped",
          error: "Invalid email format or contains whitespace"
        })
        setEmailProgress({ current: i + 1, total: selectedAttendees.length })
        continue
      }

      try {
        if (!attendee.reference_id) {
          results.push({
            name: attendee.name,
            email: attendee.email,
            status: "error",
            error: "Reference ID not found for this attendee"
          })
          setEmailProgress({ current: i + 1, total: selectedAttendees.length })
          continue
        }

        const submissionLink = `${window.location.origin}/submission/${encodeURIComponent(attendee.reference_id)}`

        const response = await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: attendee.email,
            name: attendee.name,
            attendee_id: attendee.id,
            reference_id: attendee.reference_id,
            event_name: eventName,
            venue: venue,
            event_id: parseInt(eventId),
            link: submissionLink
          })
        })

        const data = await response.json()

        if (data.success) {
          results.push({
            name: attendee.name,
            email: attendee.email,
            status: "success"
          })
        } else {
          results.push({
            name: attendee.name,
            email: attendee.email,
            status: "error",
            error: data.error || "Unknown error"
          })
        }
      } catch (error: any) {
        results.push({
          name: attendee.name,
          email: attendee.email,
          status: "error",
          error: error.message || "Network error"
        })
      }

      setEmailProgress({ current: i + 1, total: selectedAttendees.length })
      setEmailResults([...results])
    }

    setIsSendingEmails(false)
    setShowEmailResults(true)
  }

  const handleQuickActionSelect = (mode: QuickActionMode) => {
    setQuickActionMode(mode)
    setSelectedIds([])
    setShowEmailResults(false)
    setEmailResults([])
    if (mode === "attendance" && scheduleDates.length > 0) {
      setSelectedDate(scheduleDates[0].date)
    }
  }

  const handleCancelQuickAction = () => {
    setQuickActionMode(null)
    setSelectedIds([])
    setSelectedDate("")
    setShowEmailResults(false)
    setEmailResults([])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAttendees.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredAttendees.map(a => a.id))
    }
  }

  const toggleSelectAttendee = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const executeQuickAction = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one attendee")
      return
    }

    if (quickActionMode === "email") {
      await sendConfirmationEmails()
      return
    }

    if (quickActionMode === "delete") {
      const confirmed = window.confirm(`Delete ${selectedIds.length} attendee(s)? This cannot be undone.`)
      if (!confirmed) return

      const { error } = await supabase
        .from("attendees")
        .delete()
        .in("id", selectedIds)

      if (error) {
        alert(error.message || "Failed to delete attendees")
        return
      }

      setAttendees(prev => prev.filter(a => !selectedIds.includes(a.id)))
      alert(`Deleted ${selectedIds.length} attendee(s)`)
      handleCancelQuickAction()
      return
    }

    if (quickActionMode === "payment") {
      const updates = selectedIds.map(id =>
        supabase
          .from("attendees")
          .update({ payment_status: "Fully Paid" })
          .eq("id", id)
      )

      await Promise.all(updates)

      setAttendees(prev =>
        prev.map(a =>
          selectedIds.includes(a.id) ? { ...a, payment_status: "Fully Paid" } : a
        )
      )

      alert(`✅ Marked ${selectedIds.length} attendee(s) as Fully Paid`)
    } else if (
      quickActionMode === "organizer" ||
      quickActionMode === "speaker" ||
      quickActionMode === "attendee" ||
      quickActionMode === "paying" ||
      quickActionMode === "non-paying"
    ) {
      const roleToAdd =
        quickActionMode === "organizer"
          ? "Organizer"
          : quickActionMode === "speaker"
            ? "Speaker"
            : quickActionMode === "attendee"
              ? "Attendee"
              : quickActionMode === "paying"
                ? "Paying"
                : "Non-Paying"

      const updates = selectedIds.map(async (id) => {
        const attendee = attendees.find(a => a.id === id)
        if (!attendee) return

        const updatedRoles = applyRoleTag(attendee.roles || [], roleToAdd)

        return supabase
          .from("attendees")
          .update({ roles: updatedRoles })
          .eq("id", id)
      })

      await Promise.all(updates)

      const { data } = await supabase
        .from("attendees")
        .select("*")
        .eq("event_id", parseInt(eventId))

      if (data) {
        setAttendees(
          data.map((a: any) => ({
            id: a.id,
            name: `${a.personal_name ?? ""} ${a.last_name ?? ""}`.trim(),
            email: a.email ?? "",
            attendance: a.attendance || [],
            personal_name: a.personal_name,
            middle_name: a.middle_name,
            last_name: a.last_name,
            mobile_number: a.mobile_number,
            date_of_birth: a.date_of_birth,
            address: a.address,
            company: a.company,
            position: a.position,
            company_address: a.company_address,
            payment_status: a.payment_status || "Pending",
            reference_id: a.reference_id,
            roles: a.roles || []
          }))
        )
      }

      alert(`✅ Marked ${selectedIds.length} attendee(s) as ${roleToAdd}`)
    } else if (quickActionMode === "attendance" && selectedDate) {
      const epochDate = scheduleDateEpoch(selectedDate)

      const updates = selectedIds.map(async (id) => {
        const attendee = attendees.find(a => a.id === id)
        if (!attendee) return

        const updatedAttendance = attendee.attendance.filter(a => !attendanceMatchesDate(a.date, selectedDate))
        updatedAttendance.push({ date: epochDate, status: "Present" })

        return supabase
          .from("attendees")
          .update({ attendance: updatedAttendance })
          .eq("id", id)
      })

      await Promise.all(updates)

      const { data } = await supabase
        .from("attendees")
        .select("*")
        .eq("event_id", parseInt(eventId))

      if (data) {
        setAttendees(
          data.map((a: any) => ({
            id: a.id,
            name: `${a.personal_name ?? ""} ${a.last_name ?? ""}`.trim(),
            email: a.email ?? "",
            attendance: a.attendance || [],
            personal_name: a.personal_name,
            middle_name: a.middle_name,
            last_name: a.last_name,
            mobile_number: a.mobile_number,
            date_of_birth: a.date_of_birth,
            address: a.address,
            company: a.company,
            position: a.position,
            company_address: a.company_address,
            payment_status: a.payment_status || "Pending",
            reference_id: a.reference_id,
            roles: a.roles || []
          }))
        )
      }

      alert(`✅ Marked ${selectedIds.length} attendee(s) as Present`)
    }

    handleCancelQuickAction()
  }

  // Optimized filtering with useMemo
  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees

    const lowerQuery = searchQuery.toLowerCase()
    return attendees.filter((attendee) => {
      const name = attendee.name?.toLowerCase() || ""
      const email = attendee.email?.toLowerCase() || ""
      return name.includes(lowerQuery) || email.includes(lowerQuery)
    })
  }, [attendees, searchQuery])

  const getStatusDisplay = useCallback((attendee: Attendee, date: string) => {
    const record = attendee.attendance.find((a) => attendanceMatchesDate(a.date, date))
    return record?.status ?? "Pending"
  }, [])

  const getPaymentStatusColor = useCallback((status?: string, roles?: string[]) => {
    if (isPaymentExempt(roles)) {
      return "bg-gray-200 text-gray-500 border-gray-300 opacity-50"
    }

    switch (status) {
      case "Fully Paid":
        return "bg-green-100 text-green-700 border-green-300"
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "Pending":
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }, [isPaymentExempt])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Organizer":
        return <Users className="h-3 w-3" />
      case "Speaker":
        return <Mic className="h-3 w-3" />
      case "Attendee":
        return <UserCircle className="h-3 w-3" />
      case "Paying":
        return <CircleDollarSign className="h-3 w-3" />
      case "Non-Paying":
        return <Gift className="h-3 w-3" />
      default:
        return null
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Organizer":
        return "bg-blue-100 text-blue-700"
      case "Speaker":
        return "bg-purple-100 text-purple-700"
      case "Attendee":
        return "bg-gray-100 text-gray-700"
      case "Paying":
        return "bg-emerald-100 text-emerald-700"
      case "Non-Paying":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const quickActionTitle =
    quickActionMode === "payment"
      ? "Quick Mark as Fully Paid"
      : quickActionMode === "attendance"
        ? "Quick Mark as Present"
        : quickActionMode === "organizer"
          ? "Quick Mark as Organizer"
          : quickActionMode === "speaker"
            ? "Quick Mark as Speaker"
            : quickActionMode === "attendee"
              ? "Quick Mark as Attendee"
              : quickActionMode === "paying"
                ? "Quick Mark as Paying"
                : quickActionMode === "non-paying"
                  ? "Quick Mark as Non-Paying"
                  : quickActionMode === "delete"
                    ? "Delete selected attendees"
                    : "Send Confirmation Emails"

  const successCount = emailResults.filter(r => r.status === "success").length
  const errorCount = emailResults.filter(r => r.status === "error").length
  const skippedCount = emailResults.filter(r => r.status === "skipped").length

  return (
    <>
      <Card className="flex h-full min-h-0 w-full min-w-0 flex-col rounded-2xl border border-[#E8EAEB] bg-white shadow-sm">
        <CardHeader className="shrink-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg text-[#1E1E1E]">Attendance</CardTitle>
              <CardDescription className="mt-1 text-[#8D959D]">
                Search, tag, and update attendees
              </CardDescription>
            </div>
            <span className="inline-flex w-fit items-center rounded-lg border border-[#E8EAEB] bg-[#F7FBF8] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#0B1F14]">
              {filteredAttendees.length} shown
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D959D]" />
              <Input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl border-[#E8EAEB] bg-[#F7FBF8] pl-9 focus-visible:bg-white"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-11 shrink-0 gap-2 rounded-xl bg-[#0B1F14] px-4 font-semibold text-white hover:bg-[#0B1F14]/90">
                  <Zap className="h-4 w-4" />
                  Quick Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-[#8D959D]">
                  Communication
                </DropdownMenuLabel>
                <DropdownMenuItem className="py-2.5" onClick={() => handleQuickActionSelect("email")}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Confirmation Emails
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-[#8D959D]">
                  Status
                </DropdownMenuLabel>
                <DropdownMenuItem className="py-2.5" onClick={() => handleQuickActionSelect("payment")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Fully Paid
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2.5" onClick={() => handleQuickActionSelect("attendance")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Mark as Present
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-[#8D959D]">
                  Tags
                </DropdownMenuLabel>
                <DropdownMenuItem className="py-2.5" onClick={() => handleQuickActionSelect("organizer")}>
                  <Users className="mr-2 h-4 w-4" />
                  Mark as Organizer
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2.5" onClick={() => handleQuickActionSelect("speaker")}>
                  <Mic className="mr-2 h-4 w-4" />
                  Mark as Speaker
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2.5" onClick={() => handleQuickActionSelect("attendee")}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Mark as Attendee
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2.5" onClick={() => handleQuickActionSelect("paying")}>
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  Mark as Paying
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2.5" onClick={() => handleQuickActionSelect("non-paying")}>
                  <Gift className="mr-2 h-4 w-4" />
                  Mark as Non-Paying
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleQuickActionSelect("delete")}
                  className="py-2.5 text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete attendees
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {quickActionMode && (
            <div className="rounded-xl border border-[#0B1F14]/15 bg-[#F7FBF8] p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B1F14] text-white">
                      <Zap className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1E1E1E]">{quickActionTitle}</p>
                      <p className="text-xs text-[#8D959D]">Select rows below, then apply</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelQuickAction}
                    className="h-8 w-8 shrink-0 p-0"
                    disabled={isSendingEmails}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  {quickActionMode === "attendance" && (
                    <Select value={selectedDate} onValueChange={setSelectedDate}>
                      <SelectTrigger className="w-full sm:w-[250px] bg-white">
                        <SelectValue placeholder="Select date" />
                      </SelectTrigger>
                      <SelectContent>
                        {scheduleDates.map((d) => (
                          <SelectItem key={d.date} value={d.date}>
                            {new Date(d.date).toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex flex-1 items-center justify-between gap-3 sm:justify-start">
                    <span className="rounded-md bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-[#0B1F14] ring-1 ring-[#E8EAEB]">
                      {selectedIds.length} selected
                    </span>

                    <Button
                      size="sm"
                      onClick={executeQuickAction}
                      disabled={
                        selectedIds.length === 0 ||
                        (quickActionMode === "attendance" && !selectedDate) ||
                        isSendingEmails
                      }
                      className={`gap-2 whitespace-nowrap rounded-lg font-semibold ${
                        quickActionMode === "delete"
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-[#00D47E] text-[#0B1F14] hover:bg-[#00c174]"
                      }`}
                    >
                      {isSendingEmails ? (
                        <>
                          <Send className="h-4 w-4 animate-pulse" />
                          Sending...
                        </>
                      ) : (
                        <>
                          {quickActionMode === "email"
                            ? "Send Emails"
                            : quickActionMode === "delete"
                              ? `Delete ${selectedIds.length}`
                              : `Apply to ${selectedIds.length}`}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isSendingEmails && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sending emails...</span>
                      <span className="font-medium">
                        {emailProgress.current} / {emailProgress.total}
                      </span>
                    </div>
                    <Progress
                      value={(emailProgress.current / emailProgress.total) * 100}
                      className="h-2"
                    />
                  </div>
                )}

                {showEmailResults && emailResults.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Email Results</h4>
                      <div className="flex gap-3 text-xs">
                        <span className="text-green-600">✓ {successCount} sent</span>
                        {errorCount > 0 && <span className="text-red-600">✗ {errorCount} failed</span>}
                        {skippedCount > 0 && <span className="text-orange-600">⊘ {skippedCount} skipped</span>}
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 bg-white rounded border p-3">
                      {emailResults.map((result, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 text-sm p-2 rounded ${result.status === "success"
                              ? "bg-green-50 border-l-2 border-green-500"
                              : result.status === "skipped"
                                ? "bg-orange-50 border-l-2 border-orange-500"
                                : "bg-red-50 border-l-2 border-red-500"
                            }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {result.status === "success" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : result.status === "skipped" ? (
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{result.email}</div>
                            {result.error && (
                              <div className="text-xs text-red-600 mt-1">{result.error}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
          <div className="min-h-0 w-full min-w-0 flex-1 overflow-x-auto overflow-y-auto rounded-xl border border-[#E8EAEB]">
            <table className="relative w-full min-w-0 table-auto text-sm">
              <thead className="sticky top-0 z-10 border-b border-[#E8EAEB] bg-[#F7FBF8]">
                <tr>
                  {quickActionMode && (
                    <th className="sticky left-0 z-20 bg-[#F7FBF8] px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredAttendees.length && filteredAttendees.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 cursor-pointer accent-[#00D47E]"
                        disabled={isSendingEmails}
                      />
                    </th>
                  )}
                  <th
                    className={`bg-[#F7FBF8] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8D959D] ${
                      quickActionMode ? "" : "sticky left-0 z-20"
                    }`}
                  >
                    Attendee
                  </th>
                  <th className="bg-[#F7FBF8] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                    Payment
                  </th>
                  {scheduleDates.map((d) => (
                    <th
                      key={d.date}
                      className="whitespace-nowrap bg-[#F7FBF8] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8D959D]"
                    >
                      {new Date(d.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </th>
                  ))}
                  <th className="bg-[#F7FBF8] px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                    Edit
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.map((attendee) => {
                  const exempt = isPaymentExempt(attendee.roles)
                  const selected = selectedIds.includes(attendee.id)

                  return (
                    <tr
                      key={attendee.id}
                      className={`border-b border-[#E8EAEB] transition-colors ${
                        selected ? "bg-[#00D47E]/10" : "bg-white hover:bg-[#F7FBF8]"
                      }`}
                    >
                      {quickActionMode && (
                        <td className={`sticky left-0 z-10 px-3 py-3 ${selected ? "bg-[#E8F9F0]" : "bg-white"}`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelectAttendee(attendee.id)}
                            className="h-4 w-4 cursor-pointer accent-[#00D47E]"
                            disabled={isSendingEmails}
                          />
                        </td>
                      )}
                      <td
                        className={`min-w-[12rem] max-w-[22rem] px-3 py-3 ${
                          quickActionMode ? "" : "sticky left-0 z-10"
                        } ${selected ? "bg-[#E8F9F0]" : "bg-white"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#1E1E1E]">{attendee.name}</p>
                            <p className="truncate text-xs text-[#8D959D]">{attendee.email}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {attendee.roles && attendee.roles.length > 0 ? (
                                attendee.roles.map((role) => (
                                  <span
                                    key={role}
                                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${getRoleColor(role)}`}
                                  >
                                    {getRoleIcon(role)}
                                    {role}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-[#8D959D]">No tags</span>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 shrink-0 rounded-lg border-[#E8EAEB] px-2 text-xs"
                                disabled={quickActionMode !== null}
                              >
                                Tags
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {(["Organizer", "Speaker", "Attendee", "Paying", "Non-Paying"] as const).map((role) => (
                                <DropdownMenuItem key={role} className="py-2" onClick={() => toggleRole(attendee.id, role)}>
                                  <div className="flex w-full items-center gap-2">
                                    {getRoleIcon(role)}
                                    <span className="flex-1">{role}</span>
                                    {attendee.roles?.includes(role) && (
                                      <CheckCircle2 className="h-4 w-4 text-[#00D47E]" />
                                    )}
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {exempt ? (
                          <span className={`inline-flex rounded-lg border px-2.5 py-1.5 text-xs font-medium ${getPaymentStatusColor(attendee.payment_status, attendee.roles)}`}>
                            N/A
                          </span>
                        ) : (
                          <Select
                            value={attendee.payment_status || "Pending"}
                            onValueChange={(value) => updatePaymentStatus(attendee.id, value)}
                            disabled={quickActionMode !== null}
                          >
                            <SelectTrigger className={`h-9 w-[8.5rem] rounded-lg text-xs font-medium ${getPaymentStatusColor(attendee.payment_status, attendee.roles)}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </div>
                              </SelectItem>
                              <SelectItem value="Partially Paid">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-3 w-3" />
                                  Partially Paid
                                </div>
                              </SelectItem>
                              <SelectItem value="Fully Paid">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Fully Paid
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>

                      {scheduleDates.map((d) => {
                        const status = getStatusDisplay(attendee, d.date)
                        return (
                          <td key={d.date} className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => toggleAttendance(attendee.id, d.date)}
                              disabled={quickActionMode !== null}
                              className={`inline-flex h-9 min-w-[4.75rem] items-center justify-center gap-1 rounded-lg border px-2 text-xs font-semibold transition disabled:opacity-50 ${
                                status === "Present"
                                  ? "border-[#00D47E] bg-[#00D47E]/15 text-[#0B1F14]"
                                  : status === "Absent"
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-[#E8EAEB] bg-[#F7FBF8] text-[#8D959D] hover:border-[#00D47E]/50"
                              }`}
                            >
                              {status}
                            </button>
                          </td>
                        )
                      })}
                      <td className="px-3 py-3 text-center">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(attendee)}
                          className="h-9 w-9 rounded-lg border-[#E8EAEB]"
                          disabled={quickActionMode !== null}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Attendee Modal */}
      <Dialog open={!!editingAttendee} onOpenChange={() => setEditingAttendee(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Attendee Information</DialogTitle>
            <DialogDescription>
              Update the attendee's personal and contact information
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Personal Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="personal_name">First Name *</Label>
                <Input
                  id="personal_name"
                  value={editForm.personal_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, personal_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={editForm.middle_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  value={editForm.mobile_number || ""}
                  onChange={(e) => setEditForm({ ...editForm, mobile_number: e.target.value })}
                />
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={editForm.date_of_birth || ""}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editForm.address || ""}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
            </div>

            {/* Company Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={editForm.company || ""}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={editForm.position || ""}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company_address">Company Address</Label>
              <Input
                id="company_address"
                value={editForm.company_address || ""}
                onChange={(e) => setEditForm({ ...editForm, company_address: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingAttendee(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="w-full sm:w-auto">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}