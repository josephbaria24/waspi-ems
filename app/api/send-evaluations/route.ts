import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createClient } from "@supabase/supabase-js"
import { renderEmailTemplate } from "@/lib/email-templates"
import { loadEventEmailTemplate } from "@/lib/load-event-email-template"
import { buildEventBannerMail } from "@/lib/event-banner-mail"
import { markAttendeeEmailStatus } from "@/lib/email-status"

// ✅ Setup Supabase (Server-side client)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ✅ Setup SMTP transporter (Hostinger)
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "no-reply@waspi.ph",
    pass: "@Notsotrickypassword123",
  },
})

// ✅ Email validation function
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  email = email.trim()
  if (email.includes(" ")) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(req: Request) {
  try {
    // 🧩 1. Parse request body
    const { eventId, attendeeIds } = await req.json()

    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 })
    }

    // 🧠 2. Build query dynamically
    let query = supabase
      .from("attendees")
      .select("id, personal_name, last_name, email, reference_id, hassentevaluation")
      .eq("event_id", eventId)

    if (Array.isArray(attendeeIds) && attendeeIds.length > 0) {
      query = query.in("id", attendeeIds)
    } else {
      query = query.eq("hassentevaluation", false)
    }

    const { data: attendees, error } = await query

    if (error) throw error
    if (!attendees?.length) {
      return NextResponse.json({ message: "No attendees to send evaluations." })
    }

    // 🧩 3. Get event details
    const { data: event } = await supabase
      .from("events")
      .select("name, feature_image")
      .eq("id", eventId)
      .single()

    // ✅ Determine base URL dynamically
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000"

    const banner = await buildEventBannerMail(event?.feature_image)

    // ✅ 4. Send evaluation emails with detailed tracking
    const successful: Array<{ id: number; name: string; email: string }> = []
    const failed: Array<{ id: number; name: string; email: string; error: string }> = []

    for (const attendee of attendees) {
      const fullName = `${attendee.personal_name} ${attendee.last_name}`

      // Validate email
      if (!attendee.email) {
        failed.push({
          id: attendee.id,
          name: fullName,
          email: attendee.email || "N/A",
          error: "Email address is missing",
        })
        continue
      }

      const cleanEmail = attendee.email.trim()
      if (!isValidEmail(cleanEmail)) {
        let errorMsg = "Invalid email format"
        if (attendee.email.includes(" ")) {
          errorMsg = "Email contains spaces"
        }
        failed.push({
          id: attendee.id,
          name: fullName,
          email: attendee.email,
          error: errorMsg,
        })
        continue
      }

      try {
        const evalLink = `${baseUrl}/evaluation/${encodeURIComponent(attendee.reference_id)}`
        const template = await loadEventEmailTemplate(Number(eventId), "evaluation_invite")

        if (!template.enabled) {
          failed.push({
            id: attendee.id,
            name: fullName,
            email: cleanEmail,
            error: "Evaluation email template is disabled",
          })
          continue
        }

        const rendered = renderEmailTemplate(template, {
          name: fullName,
          first_name: attendee.personal_name || "",
          event_name: event?.name || "",
          eval_link: evalLink,
          link: evalLink,
          reference_id: attendee.reference_id || "",
        }, { bannerSrc: banner?.src })

        const mailOptions = {
          from: `"${rendered.fromName}" <no-reply@waspi.ph>`,
          to: cleanEmail,
          subject: rendered.subject,
          html: rendered.html,
          attachments: banner?.attachments || [],
        }

        await transporter.sendMail(mailOptions)

        // 🧾 Mark attendee as "evaluation sent"
        await supabase
          .from("attendees")
          .update({ hassentevaluation: true })
          .eq("id", attendee.id)

        await markAttendeeEmailStatus(supabase, [attendee.id], "evaluation")

        successful.push({
          id: attendee.id,
          name: fullName,
          email: cleanEmail,
        })
      } catch (emailError: any) {
        failed.push({
          id: attendee.id,
          name: fullName,
          email: cleanEmail,
          error: emailError.message || "Failed to send email",
        })
      }
    }

    return NextResponse.json({
      message: "✅ Email sending process completed.",
      result: { successful, failed },
    })
  } catch (error) {
    console.error("❌ Send Evaluations Error:", error)
    return NextResponse.json(
      { error: "Failed to send evaluations" },
      { status: 500 }
    )
  }
}
