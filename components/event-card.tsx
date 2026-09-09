"use client"

import { Calendar, Clock, MapPin } from "lucide-react"
import type { Event } from "@/types/event"

type EventWithStats = Omit<Event, "attendees"> & {
  attendees: {
    registered: number
    attended: number
    paid: number
  }
}

const PLACEHOLDERS = [
  "linear-gradient(135deg, #1a6b6b 0%, #c45c4a 55%, #e8a090 100%)",
  "linear-gradient(145deg, #3d3428 0%, #c4a574 48%, #8a6a42 100%)",
  "linear-gradient(135deg, #0e7490 0%, #5eead4 45%, #0f766e 100%)",
  "linear-gradient(135deg, #0B1F14 0%, #00D47E 55%, #017C7C 100%)",
]

function formatDate(value?: string) {
  if (!value) return "Date TBA"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date TBA"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(value?: string) {
  if (!value) return ""
  const [hours, minutes] = value.split(":")
  const hour = Number(hours)
  if (Number.isNaN(hour)) return value
  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes || "00"} ${period}`
}

export function EventCard({ event, onSelect }: { event: EventWithStats; onSelect: () => void }) {
  const firstDay = event.schedule?.[0]
  const dateLabel = formatDate(event.start_date || firstDay?.date)
  const start = formatTime(firstDay?.timeIn)
  const end = formatTime(firstDay?.timeOut)
  const timeLabel = start && end ? `${start} - ${end}` : start || end || "Time TBA"
  const imageIndex = Number.parseInt(event.id, 10) % PLACEHOLDERS.length || 0

  return (
    <article className="flex h-full flex-col rounded-[28px] border border-[#E8EAEB] bg-white p-3 shadow-sm">
      <div className="relative h-40 overflow-hidden rounded-[22px] bg-[#E8EAEB]">
        {event.feature_image ? (
          <img
            src={event.feature_image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full" style={{ background: PLACEHOLDERS[imageIndex] }} />
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-[#1E1E1E]">
          {event.name}
        </h3>

        <div className="mt-3 flex items-center gap-2 text-sm text-[#8D959D]">
          <MapPin className="h-4 w-4 shrink-0 text-[#F97316]" />
          <span className="truncate">{event.venue || "Venue TBA"}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#8D959D]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#F97316]" />
            {dateLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#F97316]" />
            {timeLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={onSelect}
          className="mt-5 w-full rounded-full bg-[#3F3A63] py-3 text-sm font-semibold text-white transition hover:bg-[#322e52]"
        >
          View Event
        </button>
      </div>
    </article>
  )
}
