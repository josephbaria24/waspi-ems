//components\event-details.tsx
"use client"
import { ArrowLeft, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { EventDetailsCard } from "@/components/event-details-card"
import { AttendeesList } from "@/components/attendees-list"
import type { Event } from "@/types/event"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"

// Extended Event type with stats
type EventWithStats = Omit<Event, "attendees"> & {
  attendees: {
    registered: number
    attended: number
    paid: number
  }
}

export function EventDetails({ eventId, onBack }: { eventId: string; onBack?: () => void }) {
  const [event, setEvent] = useState<EventWithStats | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => setRefreshKey(prev => prev + 1)
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push("/")
    }
  }

  useEffect(() => {
    const fetchEvent = async () => {
      // Fetch event details
      const { data, error } = await supabase
        .from("events")
        .select("*, magic_link, schedules")
        .eq("id", parseInt(eventId))
        .single()

      if (error) {
        console.error("Error fetching event:", error)
        return
      }

      if (!data) return

      // Fetch all attendees for this event with their attendance and payment data
      const { data: attendeesData, error: attendeesError } = await supabase
        .from("attendees")
        .select("attendance, payment_status")
        .eq("event_id", data.id)

      if (attendeesError) {
        console.error("Error fetching attendees:", attendeesError)
      }

      // Calculate stats
      const stats = {
        registered: 0,
        attended: 0,
        paid: 0,
      }

      attendeesData?.forEach((attendee) => {
        // Count all attendees as registered
        stats.registered += 1

        // Count attended (those with non-empty attendance object)
        if (
          attendee.attendance &&
          typeof attendee.attendance === 'object' &&
          Object.keys(attendee.attendance).length > 0
        ) {
          stats.attended += 1
        }

        // Count paid (those with "Fully Paid" status)
        if (attendee.payment_status === "Fully Paid") {
          stats.paid += 1
        }
      })

      setEvent({
        id: data.id.toString(),
        name: data.name,
        description: data.description,
        type: data.type,
        price: Number(data.price),
        venue: data.venue,
        feature_image: data.feature_image,
        schedule: data.schedules ?? [],
        attendees: stats, // Now using stats object instead of single number
        createdAt: data.created_at,
        magic_link: data.magic_link,
        start_date: data.start_date,
        end_date: data.end_date,
      })
    }

    fetchEvent()
  }, [eventId, refreshKey])

  if (!event) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#F7FBF8] p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#E8EAEB] border-b-[#00D47E]" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F7FBF8] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#0B1F14] px-5 py-6 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#00D47E]/25" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-40 rounded-full bg-[#017C7C]/40" />
          <div className="relative flex items-start gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 shrink-0 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-[#00D47E]/15 px-2.5 py-1 text-xs font-semibold text-[#00D47E]">
                {event.type}
              </span>
              <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{event.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#00D47E]" />
                  {event.venue}
                </span>
                <span className="font-semibold text-[#00D47E]">
                  ₱{Number(event.price).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EventDetailsCard event={event} onAttendeeAdded={handleRefresh} />
          <AttendeesList
            eventId={eventId}
            scheduleDates={event.schedule.map((s) => ({ date: s.date }))}
            refreshKey={refreshKey}
          />
        </div>
      </div>
    </main>
  )
}