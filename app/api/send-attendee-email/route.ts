import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import QRCode from "qrcode"
import { createClient } from "@supabase/supabase-js"
import { attendeeDisplayName, buildAttendeeQrValue } from "@/lib/attendee-qr"
import { renderEmailTemplate, type EmailTemplateKey } from "@/lib/email-templates"
import { loadEventEmailTemplate } from "@/lib/load-event-email-template"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "no-reply@waspi.ph",
    pass: "@Notsotrickypassword123",
  },
})

function isValidEmail(email: string) {
  const trimmed = email.trim()
  if (!trimmed || trimmed.includes(" ")) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function formatAgenda(schedules: unknown) {
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return "Schedule will be announced at the venue."
  }

  return schedules
    .map((day, index) => {
      const item = day as { date?: string; timeIn?: string; timeOut?: string; coveredTopics?: string[] }
      const rawDate = String(item?.date || "").slice(0, 10)
      const dateLabel = rawDate
        ? new Date(`${rawDate}T12:00:00`).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : `Day ${index + 1}`
      const time = [item?.timeIn, item?.timeOut].filter(Boolean).join(" – ")
      const topics = Array.isArray(item?.coveredTopics)
        ? item.coveredTopics.map((topic) => String(topic)).filter(Boolean)
        : []

      return [
        escapeHtml(dateLabel),
        time ? escapeHtml(time) : "",
        topics.length ? `Topics: ${escapeHtml(topics.join(", "))}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n\n")
}

export async function POST(req: Request) {
  try {
    const { eventId, attendeeIds, kind } = await req.json()

    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 })
    }
    if (kind !== "qr" && kind !== "event_info") {
      return NextResponse.json({ error: "Unknown email type" }, { status: 400 })
    }
    if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
      return NextResponse.json({ error: "Select at least one attendee" }, { status: 400 })
    }

    const templateKey: EmailTemplateKey = kind === "event_info" ? "event_info" : "registration_confirmation"
    const template = await loadEventEmailTemplate(Number(eventId), templateKey)
    if (!template.enabled) {
      return NextResponse.json({ error: "This email template is turned off in Edit Emails" }, { status: 400 })
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("name, venue, schedules")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const { data: attendees, error } = await supabase
      .from("attendees")
      .select("id, personal_name, middle_name, last_name, email, reference_id")
      .eq("event_id", eventId)
      .in("id", attendeeIds)

    if (error) throw error
    if (!attendees?.length) {
      return NextResponse.json({ error: "No attendees found" }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get("origin") || "http://localhost:3000"
    const agenda = formatAgenda(event.schedules)
    const successful: Array<{ id: number; name: string; email: string }> = []
    const failed: Array<{ id: number; name: string; email: string; error: string }> = []

    for (const attendee of attendees) {
      const fullName = attendeeDisplayName(attendee) || "Attendee"
      const cleanEmail = String(attendee.email || "").trim()

      if (!isValidEmail(cleanEmail)) {
        failed.push({
          id: attendee.id,
          name: fullName,
          email: attendee.email || "N/A",
          error: attendee.email ? "Invalid email format" : "Email address is missing",
        })
        continue
      }

      try {
        const link = attendee.reference_id
          ? `${baseUrl}/submission/${encodeURIComponent(attendee.reference_id)}`
          : baseUrl
        const qrValue = buildAttendeeQrValue({
          attendeeId: attendee.id,
          referenceId: attendee.reference_id,
          name: fullName,
          email: cleanEmail,
        })
        const qrDataUrl = await QRCode.toDataURL(qrValue, {
          width: 280,
          margin: 1,
          errorCorrectionLevel: "M",
        })
        const rendered = renderEmailTemplate(
          template,
          {
            name: fullName,
            first_name: attendee.personal_name || fullName,
            event_name: event.name || "",
            venue: event.venue || "",
            reference_id: attendee.reference_id || "",
            link,
            agenda,
          },
          { qrDataUrl, qrCaption: fullName },
        )

        await transporter.sendMail({
          from: `"${rendered.fromName}" <no-reply@waspi.ph>`,
          to: cleanEmail,
          subject: rendered.subject,
          html: rendered.html,
        })

        successful.push({ id: attendee.id, name: fullName, email: cleanEmail })
      } catch (emailError: any) {
        failed.push({
          id: attendee.id,
          name: fullName,
          email: cleanEmail,
          error: emailError?.message || "Failed to send email",
        })
      }
    }

    return NextResponse.json({
      message: "Email sending finished.",
      result: { successful, failed },
    })
  } catch (error) {
    console.error("Send attendee email error:", error)
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 })
  }
}
