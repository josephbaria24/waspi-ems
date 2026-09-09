"use client"

import { useState, useEffect } from "react"
import { Plus, CalendarDays, Clock4, Users, CheckCircle2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventModal } from "@/components/event-modal"
import { EventCard } from "@/components/event-card"
import type { Event } from "@/types/event"
import { supabase } from "@/lib/supabase-client"

// Extended version of Event that adds attendee stats
type EventWithStats = Omit<Event, "attendees"> & {
  attendees: {
    registered: number
    attended: number
    paid: number
  }
}

// Helper function to fetch ALL attendees (no 1000 limit)
async function fetchAllAttendees(eventId?: number) {
  const PAGE_SIZE = 1000
  let allAttendees: any[] = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from("attendees")
      .select("event_id, attendance, payment_status")
      .range(from, to)

    if (eventId !== undefined) {
      query = query.eq("event_id", eventId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching attendees:", error)
      break
    }

    if (data && data.length > 0) {
      allAttendees = [...allAttendees, ...data]

      if (data.length < PAGE_SIZE) {
        hasMore = false
      } else {
        page++
      }
    } else {
      hasMore = false
    }
  }

  return allAttendees
}

export function EventsDashboard({ onSelectEvent }: { onSelectEvent: (id: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true)

      // Get all events
      const { data: eventsData, error } = await supabase.from("events").select("*")
      if (error) {
        console.error("Error fetching events:", error)
        setIsLoading(false)
        return
      }

      if (!eventsData) {
        setIsLoading(false)
        return
      }

      // Get ALL attendees (no 1000 row limit) using pagination
      const attendeesData = await fetchAllAttendees()

      console.log(`✅ Fetched ${attendeesData.length} attendees total`)

      // Build event stats
      const attendeeStatsMap = new Map<
        number,
        { registered: number; attended: number; paid: number }
      >()

      attendeesData.forEach((attendee) => {
        const eventId = Number(attendee.event_id)
        if (!eventId || isNaN(eventId)) return

        const stats = attendeeStatsMap.get(eventId) ?? {
          registered: 0,
          attended: 0,
          paid: 0,
        }

        // Registered: Count ALL attendees
        stats.registered += 1

        // Attended: Count attendees with non-empty attendance object
        if (
          attendee.attendance &&
          typeof attendee.attendance === 'object' &&
          Object.keys(attendee.attendance).length > 0
        ) {
          stats.attended += 1
        }

        // Paid: Count attendees with "Fully Paid" status
        if (attendee.payment_status === "Fully Paid") {
          stats.paid += 1
        }

        attendeeStatsMap.set(eventId, stats)
      })

      // Format events
      const formattedEvents: EventWithStats[] = eventsData.map((event) => {
        const stats = attendeeStatsMap.get(event.id) ?? {
          registered: 0,
          attended: 0,
          paid: 0,
        }

        return {
          id: event.id.toString(),
          name: event.name,
          type: event.type,
          price: Number(event.price),
          venue: event.venue,
          feature_image: event.feature_image,
          schedule:
            event.schedules?.map((s: any) => ({
              date: s.date || s.day || "",
              timeIn: s.timeIn || s.inTime || "",
              timeOut: s.timeOut || s.outTime || "",
              coveredTopics: s.coveredTopics ?? event.topics ?? [],
            })) ?? [],
          attendees: stats,
          createdAt: event.created_at,
          start_date: event.start_date,
          end_date: event.end_date,
        }
      })

      // Helper to safely parse optional date strings
      const parseDate = (value?: string) => (value ? new Date(value) : new Date(0))

      // Sort events by date (upcoming first)
      const now = new Date()
      const upcoming = formattedEvents.filter((e) => parseDate(e.end_date) >= now)
      const past = formattedEvents.filter((e) => parseDate(e.end_date) < now)

      upcoming.sort((a, b) => parseDate(a.start_date).getTime() - parseDate(b.start_date).getTime())
      past.sort((a, b) => parseDate(b.start_date).getTime() - parseDate(a.start_date).getTime())

      setEvents([...upcoming, ...past])
      setIsLoading(false)
    }

    fetchEvents()
  }, [])

  const handleCreateEvent = (newEvent: Omit<Event, "id" | "attendees" | "createdAt">) => {
    const event: EventWithStats = {
      ...newEvent,
      id: Date.now().toString(),
      attendees: { registered: 0, attended: 0, paid: 0 },
      createdAt: new Date().toISOString(),
    }
    setEvents([...events, event])
    setIsModalOpen(false)
  }

  const now = new Date()
  const parseDate = (value?: string) => (value ? new Date(value) : new Date(0))
  const upcomingEvents = events.filter((e) => parseDate(e.end_date) >= now)
  const pastEvents = events.filter((e) => parseDate(e.end_date) < now)

  // Calculate total stats across all events
  const totalStats = events.reduce(
    (acc, event) => ({
      registered: acc.registered + event.attendees.registered,
      attended: acc.attended + event.attendees.attended,
      paid: acc.paid + event.attendees.paid,
    }),
    { registered: 0, attended: 0, paid: 0 }
  )

  // Calculate attendance rate (avoid division by zero)
  const attendanceRate = totalStats.registered > 0
    ? Math.round((totalStats.attended / totalStats.registered) * 100)
    : 0

  const paymentRate = totalStats.registered > 0
    ? Math.round((totalStats.paid / totalStats.registered) * 100)
    : 0

  const statCards = [
    {
      label: "Total Events",
      value: events.length,
      hint: `${upcomingEvents.length} upcoming · ${pastEvents.length} past`,
      icon: CalendarDays,
      tint: "bg-emerald-50 text-emerald-700",
      bar: "bg-[#00D47E]",
    },
    {
      label: "Registered",
      value: totalStats.registered.toLocaleString(),
      hint: "Total attendees",
      icon: Users,
      tint: "bg-sky-50 text-sky-700",
      bar: "bg-sky-500",
    },
    {
      label: "Attended",
      value: totalStats.attended.toLocaleString(),
      hint: `${attendanceRate}% attendance rate`,
      icon: CheckCircle2,
      tint: "bg-[#00D47E]/15 text-[#0B1F14]",
      bar: "bg-[#00D47E]",
      progress: attendanceRate,
    },
    {
      label: "Fully Paid",
      value: totalStats.paid.toLocaleString(),
      hint: `${paymentRate}% payment rate`,
      icon: CreditCard,
      tint: "bg-amber-50 text-amber-700",
      bar: "bg-amber-500",
      progress: paymentRate,
    },
  ]

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#F7FBF8] p-4 sm:p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[#E8EAEB] border-b-[#00D47E]" />
            <p className="text-sm text-[#8D959D]">Loading events and attendees...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F7FBF8] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#0B1F14] px-5 py-6 text-white sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#00D47E]/25" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-40 rounded-full bg-[#017C7C]/40" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00D47E] text-[#0B1F14]">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold sm:text-3xl">Events</h1>
                <p className="mt-1 text-sm text-white/70">Manage your events and attendees</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => { window.location.href = "/membership/admin" }}
                variant="outline"
                className="h-10 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              >
                <Users className="h-4 w-4" />
                Members
              </Button>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="h-10 rounded-full bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </div>
          </div>
        </div>

        {events.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[#E8EAEB] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8D959D]">{stat.label}</p>
                      <p className="mt-1 text-2xl font-semibold text-[#1E1E1E] sm:text-3xl">{stat.value}</p>
                    </div>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[#8D959D]">{stat.hint}</p>
                  {typeof stat.progress === "number" && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E8EAEB]">
                      <div className={`h-full rounded-full ${stat.bar}`} style={{ width: `${stat.progress}%` }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CalendarDays className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold text-[#1E1E1E] sm:text-xl">Upcoming Events</h2>
              <span className="rounded-full bg-[#00D47E]/15 px-2.5 py-0.5 text-xs font-semibold text-[#0B1F14]">
                {upcomingEvents.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} onSelect={() => onSelectEvent(event.id)} />
              ))}
            </div>
          </section>
        )}

        {pastEvents.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8EAEB] text-[#8D959D]">
                <Clock4 className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold text-[#1E1E1E] sm:text-xl">Past Events</h2>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#8D959D] ring-1 ring-[#E8EAEB]">
                {pastEvents.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} onSelect={() => onSelectEvent(event.id)} />
              ))}
            </div>
          </section>
        )}

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#CDEEDD] bg-white px-6 py-16 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00D47E]/15 text-[#0B1F14]">
              <CalendarDays className="h-7 w-7" />
            </span>
            <p className="text-lg font-semibold text-[#1E1E1E]">No events yet</p>
            <p className="mt-1 text-sm text-[#8D959D]">Create your first event to get started</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 h-10 rounded-full bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]"
            >
              <Plus className="h-4 w-4" />
              Create your first event
            </Button>
          </div>
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </main>
  )
}