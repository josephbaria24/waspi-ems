"use client"

import { useState, useEffect } from "react"
import { Plus, CalendarDays, Clock4 } from "lucide-react" // ⬅️ Added icons
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EventModal } from "@/components/event-modal"
import { EventCard } from "@/components/event-card"
import type { Event } from "@/types/event"
import { supabase } from "@/lib/supabase-client"

export function EventsDashboard({ onSelectEvent }: { onSelectEvent: (id: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const fetchEvents = async () => {
      const { data: eventsData, error } = await supabase.from("events").select("*")

      if (!error && eventsData) {
        // ✅ Get actual attendee counts
        const { data: attendeesData, error: attendeesError } = await supabase
          .from("attendees")
          .select("event_id")

        if (attendeesError) {
          console.error("Error fetching attendees:", attendeesError)
        }

        // Count attendees per event
        const attendeeCountMap = new Map<number, number>()
        attendeesData?.forEach((attendee) => {
          const count = attendeeCountMap.get(attendee.event_id) ?? 0
          attendeeCountMap.set(attendee.event_id, count + 1)
        })

        // Format events for display
        const formattedEvents: Event[] = eventsData.map((event) => ({
          id: event.id.toString(),
          name: event.name,
          type: event.type,
          price: Number(event.price),
          venue: event.venue,
          schedule:
            event.schedules?.map((s: any) => ({
              day: s.day,
              inTime: s.timeIn,
              outTime: s.timeOut,
              coveredTopics: event.topics ?? [],
            })) ?? [],
          attendees: attendeeCountMap.get(event.id) ?? 0,
          createdAt: event.created_at,
          start_date: event.start_date,
          end_date: event.end_date,
        }))

        // ✅ Helper to safely parse optional date strings
        const parseDate = (value?: string) => (value ? new Date(value) : new Date(0))

        // 🧠 Sort events by date (upcoming first)
        const now = new Date()
        const upcoming = formattedEvents.filter((e) => parseDate(e.end_date) >= now)
        const past = formattedEvents.filter((e) => parseDate(e.end_date) < now)

        upcoming.sort((a, b) => parseDate(a.start_date).getTime() - parseDate(b.start_date).getTime())
        past.sort((a, b) => parseDate(b.start_date).getTime() - parseDate(a.start_date).getTime())

        setEvents([...upcoming, ...past])
      }
    }

    fetchEvents()
  }, [])

  const handleCreateEvent = (newEvent: Omit<Event, "id" | "attendees" | "createdAt">) => {
    const event: Event = {
      ...newEvent,
      id: Date.now().toString(),
      attendees: 0,
      createdAt: new Date().toISOString(),
    }
    setEvents([...events, event])
    setIsModalOpen(false)
  }

  // 🧩 Separate events again for section rendering
  const now = new Date()
  const parseDate = (value?: string) => (value ? new Date(value) : new Date(0))
  const upcomingEvents = events.filter((e) => parseDate(e.end_date) >= now)
  const pastEvents = events.filter((e) => parseDate(e.end_date) < now)

  return (
    <main className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground">Manage your events and attendees</p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-accent"
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-8">
              <CalendarDays className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-semibold text-foreground">Upcoming Events</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={{
                    ...event,
                    // ✅ Peso currency formatting
                    price: Number(event.price),
                  }}
                  onSelect={() => onSelectEvent(event.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-10">
              <Clock4 className="h-6 w-6 text-muted-foreground" />
              <h2 className="text-2xl font-semibold text-foreground">Past Events</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={{
                    ...event,
                    price: Number(event.price),
                  }}
                  onSelect={() => onSelectEvent(event.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* No Events Fallback */}
        {events.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No events yet</p>
              <Button onClick={() => setIsModalOpen(true)} variant="outline">
                Create your first event
              </Button>
            </CardContent>
          </Card>
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
