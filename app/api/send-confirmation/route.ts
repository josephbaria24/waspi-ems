import nodemailer from "nodemailer"
import QRCode from "qrcode"
import { NextResponse } from "next/server"
import { renderEmailTemplate } from "@/lib/email-templates"
import { loadEventEmailTemplate } from "@/lib/load-event-email-template"

export async function POST(req: Request) {
  const body = await req.json()
  const { email, name, reference_id, event_name, venue, link, event_id } = body

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(reference_id)

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
      { qrDataUrl: qrCodeDataUrl },
    )

    await transporter.sendMail({
      from: `"${rendered.fromName}" <no-reply@waspi.ph>`,
      to: email,
      subject: rendered.subject,
      html: rendered.html,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Email error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
