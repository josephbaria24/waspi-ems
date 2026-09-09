"use client"

import React, { useState } from "react"
import {
  BookOpen,
  CalendarDays,
  Clock,
  GraduationCap,
  MapPin,
  Plus,
  Presentation,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Event } from "@/types/event"

const EVENT_TYPES = [
  { value: "Conference", label: "Conference", icon: Users, tint: "bg-emerald-50 text-emerald-700" },
  { value: "Seminar", label: "Seminar", icon: BookOpen, tint: "bg-sky-50 text-sky-700" },
  { value: "Training", label: "Training", icon: GraduationCap, tint: "bg-amber-50 text-amber-700" },
  { value: "Webinar", label: "Webinar", icon: Video, tint: "bg-violet-50 text-violet-700" },
] as const

type EventType = (typeof EVENT_TYPES)[number]["value"]

interface EventFormData extends Omit<Event, "id" | "attendees" | "createdAt"> {}

const emptyDay = {
  date: "",
  timeIn: "09:00",
  timeOut: "17:00",
  coveredTopics: [] as string[],
}

const fieldClass =
  "h-11 rounded-xl border-[#E8EAEB] bg-white text-sm text-[#1E1E1E] shadow-none focus-visible:border-[#00D47E] focus-visible:ring-[#00D47E]/20"

export function EventModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EventFormData) => void
}) {
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    type: "Conference",
    price: 0,
    venue: "",
    schedule: [{ ...emptyDay }],
  })

  const [topicInput, setTopicInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.venue && formData.schedule[0].coveredTopics.length > 0) {
      onSubmit(formData)
      setFormData({
        name: "",
        type: "Conference",
        price: 0,
        venue: "",
        schedule: [{ ...emptyDay }],
      })
      setTopicInput("")
    }
  }

  const addTopic = () => {
    if (topicInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        schedule: [
          {
            ...prev.schedule[0],
            coveredTopics: [...prev.schedule[0].coveredTopics, topicInput.trim()],
          },
          ...prev.schedule.slice(1),
        ],
      }))
      setTopicInput("")
    }
  }

  const removeTopic = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: [
        {
          ...prev.schedule[0],
          coveredTopics: prev.schedule[0].coveredTopics.filter((_, i) => i !== index),
        },
        ...prev.schedule.slice(1),
      ],
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] gap-0 overflow-hidden rounded-3xl border-[#E8EAEB] bg-[#F7FBF8] p-0 sm:max-w-3xl"
      >
        <div className="relative overflow-hidden bg-[#0B1F14] px-6 py-5 text-white">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#00D47E]/30" />
          <div className="pointer-events-none absolute -bottom-12 left-24 h-24 w-24 rounded-full bg-[#017C7C]/40" />
          <DialogHeader className="relative gap-1 text-left">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00D47E] text-[#0B1F14]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-semibold text-white">Create New Event</DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              Fill in the details to publish a new WASPI event.
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-8.5rem)] space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                <Presentation className="h-3.5 w-3.5 text-[#017C7C]" />
                Event Name
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter event name"
                className={fieldClass}
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                Event Type
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {EVENT_TYPES.map((type) => {
                  const Icon = type.icon
                  const selected = formData.type === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value as EventType })}
                      className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                        selected
                          ? "border-[#00D47E] bg-[#00D47E]/10 text-[#0B1F14] shadow-sm"
                          : "border-[#E8EAEB] bg-white text-[#1E1E1E] hover:border-[#00D47E]/50"
                      }`}
                    >
                      <span className={`flex h-9 w-11 items-center justify-center rounded-xl ${type.tint}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="price" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                Price
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#017C7C]">
                  ₱
                </span>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className={`${fieldClass} pl-8`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="venue" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                <MapPin className="h-3.5 w-3.5 text-[#017C7C]" />
                Venue
              </Label>
              <Input
                id="venue"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Enter venue"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[#E8EAEB] bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1E1E1E]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CalendarDays className="h-4 w-4" />
                </span>
                Schedule
              </h3>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    schedule: [...prev.schedule, { ...emptyDay, coveredTopics: [] }],
                  }))
                }
                className="h-9 rounded-full border-[#E8EAEB] text-xs font-semibold text-[#0B1F14] hover:border-[#00D47E] hover:bg-[#00D47E]/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Add another day
              </Button>
            </div>

            {formData.schedule.map((sched, index) => (
              <div key={index} className="rounded-2xl border border-[#E8EAEB] bg-[#F7FBF8] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                    Day {index + 1}
                  </span>
                  {formData.schedule.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.schedule.filter((_, i) => i !== index)
                        setFormData({ ...formData, schedule: updated })
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1 text-xs text-[#8D959D]">
                      <CalendarDays className="h-3 w-3" />
                      Date
                    </Label>
                    <Input
                      type="date"
                      value={sched.date}
                      onChange={(e) => {
                        const updated = [...formData.schedule]
                        updated[index] = { ...updated[index], date: e.target.value }
                        setFormData({ ...formData, schedule: updated })
                      }}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1 text-xs text-[#8D959D]">
                      <Clock className="h-3 w-3" />
                      Start
                    </Label>
                    <Input
                      type="time"
                      value={sched.timeIn}
                      onChange={(e) => {
                        const updated = [...formData.schedule]
                        updated[index] = { ...updated[index], timeIn: e.target.value }
                        setFormData({ ...formData, schedule: updated })
                      }}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1 text-xs text-[#8D959D]">
                      <Clock className="h-3 w-3" />
                      End
                    </Label>
                    <Input
                      type="time"
                      value={sched.timeOut}
                      onChange={(e) => {
                        const updated = [...formData.schedule]
                        updated[index] = { ...updated[index], timeOut: e.target.value }
                        setFormData({ ...formData, schedule: updated })
                      }}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl border border-[#E8EAEB] bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1E1E1E]">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <BookOpen className="h-4 w-4" />
              </span>
              Covered Topics
            </h3>

            <div className="flex gap-2">
              <Input
                disabled={formData.schedule.length === 0}
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
                placeholder="Enter a topic and press Enter"
                className={fieldClass}
              />
              <Button
                type="button"
                onClick={addTopic}
                disabled={formData.schedule.length === 0}
                className="h-11 rounded-xl bg-[#0B1F14] px-4 text-white hover:bg-[#0B1F14]/90"
              >
                Add
              </Button>
            </div>

            {formData.schedule.length > 0 && formData.schedule[0].coveredTopics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.schedule[0].coveredTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 rounded-full bg-[#00D47E]/15 px-3 py-1.5 text-sm font-medium text-[#0B1F14]"
                  >
                    {topic}
                    <button
                      type="button"
                      onClick={() => removeTopic(index)}
                      className="rounded-full p-0.5 hover:bg-[#0B1F14]/10"
                      aria-label={`Remove ${topic}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 flex-1 rounded-full border-[#E8EAEB] text-[#1E1E1E] hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 rounded-full bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]"
            >
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
