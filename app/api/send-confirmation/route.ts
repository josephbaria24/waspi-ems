import nodemailer from "nodemailer"
import { NextResponse } from "next/server"
import { buildAttendeeQrValue } from "@/lib/attendee-qr"
import { buildAttendeeQrMail } from "@/lib/attendee-qr-mail"
import { buildEventBannerMail } from "@/lib/event-banner-mail"
import { markAttendeeEmailStatus } from "@/lib/email-status"
import { renderEmailTemplate } from "@/lib/email-templates"
import { loadEventEmailTemplate } from "@/lib/load-event-email-template"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(req: Request) {
  const body = await req.json()
  const { email, name, reference_id, event_name, venue, link, event_id, attendee_id } = body

  try {
    const attendeeName = String(name || "")
    const qrValue = buildAttendeeQrValue({
      referenceId: reference_id,
      name: attendeeName,
      email: String(email || ""),
      attendeeId: attendee_id ? Number(attendee_id) : undefined,
    })
    const qrMail = await buildAttendeeQrMail({
      value: qrValue,
      name: attendeeName || "Attendee",
      eventName: String(event_name || ""),
      referenceId: String(reference_id || ""),
    })

    let featureImage = ""
    if (event_id) {
      const { data: eventRow } = await supabaseServer
        .from("events")
        .select("feature_image")
        .eq("id", Number(event_id))
        .maybeSingle()
      featureImage = eventRow?.feature_image || ""
    }
    const banner = await buildEventBannerMail(featureImage)

    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-reply@waspi.ph",
        pass: "@Notsotrickypassword123",
      },
    })

    const firstName = String(name || "").trim().split(/\s+/)[0] || name
    const template = event_id
      ? await loadEventEmailTemplate(Number(event_id), "registration_confirmation")
      : (await import("@/lib/email-templates")).createDefaultEmailTemplates().templates
          .registration_confirmation

    if (!template.enabled) {
      return NextResponse.json({ success: true, skipped: true, reason: "Template disabled" })
    }

    const rendered = renderEmailTemplate(
      template,
      {
        name: String(name || ""),
        first_name: String(firstName || ""),
        event_name: String(event_name || ""),
        venue: String(venue || ""),
        reference_id: String(reference_id || ""),
        link: String(link || "#"),
      },
      { qrCid: qrMail.cid, qrCaption: attendeeName, bannerSrc: banner?.src },
    )

    await transporter.sendMail({
      from: `"${rendered.fromName}" <no-reply@waspi.ph>`,
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      attachments: [...(banner?.attachments || []), ...qrMail.attachments],
    })

    if (attendee_id) {
      await markAttendeeEmailStatus(supabaseServer, [Number(attendee_id)], "qr")
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Email error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
