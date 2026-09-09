import nodemailer from "nodemailer"

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendMembershipReviewEmail(input: {
  email: string
  fullName: string
  trackingNumber: string
  action: "approve" | "decline"
  reason?: string
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://waspi.ph").replace(/\/$/, "")
  const portalUrl = `${siteUrl}/membership/portal`
  const uploadUrl = `${siteUrl}/membership/upload-receipt?tracking=${encodeURIComponent(input.trackingNumber)}`
  const fullName = escapeHtml(input.fullName)
  const trackingNumber = escapeHtml(input.trackingNumber)
  const reason = escapeHtml(input.reason || "Please upload a clearer or corrected payment receipt.")
  const approved = input.action === "approve"

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const fromName = (process.env.SMTP_FROM_NAME || "WASPI Membership").replace(/"/g, "")

  const html = approved
    ? `
      <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;font-family:Segoe UI,Arial,sans-serif;">
        <div style="background:#00D47E;padding:32px 28px;text-align:center;">
          <h1 style="color:#0B1F14;margin:0;font-size:26px;">Membership approved</h1>
        </div>
        <div style="padding:28px;">
          <p style="font-size:16px;color:#1E1E1E;">Hi <strong>${fullName}</strong>,</p>
          <p style="font-size:14px;color:#555;line-height:1.6;">
            Your WASPI membership is now active. Your transaction number is below.
          </p>
          <div style="background:#f0fdf4;border:2px dashed #16a35c;border-radius:10px;padding:20px;text-align:center;margin:24px 0;">
            <p style="font-size:12px;color:#777;margin:0 0 6px;text-transform:uppercase;">Transaction number</p>
            <p style="font-size:24px;font-weight:bold;color:#16a35c;margin:0;font-family:Courier New,monospace;">${trackingNumber}</p>
          </div>
          <p style="text-align:center;">
            <a href="${portalUrl}" style="display:inline-block;background:#00D47E;color:#0B1F14;padding:12px 24px;text-decoration:none;border-radius:999px;font-weight:bold;">Open member portal</a>
          </p>
        </div>
      </div>
    `
    : `
      <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;font-family:Segoe UI,Arial,sans-serif;">
        <div style="background:#fee2e2;padding:32px 28px;text-align:center;">
          <h1 style="color:#991b1b;margin:0;font-size:26px;">Receipt needs another upload</h1>
        </div>
        <div style="padding:28px;">
          <p style="font-size:16px;color:#1E1E1E;">Hi <strong>${fullName}</strong>,</p>
          <p style="font-size:14px;color:#555;line-height:1.6;">
            We could not approve your membership yet. Please review the reason and upload a new receipt.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
            <p style="font-size:12px;color:#991b1b;margin:0 0 6px;text-transform:uppercase;font-weight:700;">Reason</p>
            <p style="font-size:14px;color:#7f1d1d;margin:0;line-height:1.6;">${reason}</p>
          </div>
          <p style="font-size:13px;color:#666;">Transaction number: <strong>${trackingNumber}</strong></p>
          <p style="text-align:center;margin-top:24px;">
            <a href="${uploadUrl}" style="display:inline-block;background:#00D47E;color:#0B1F14;padding:12px 24px;text-decoration:none;border-radius:999px;font-weight:bold;">Upload a new receipt</a>
          </p>
        </div>
      </div>
    `

  await transporter.sendMail({
    from: `"${fromName}" <no-reply@waspi.ph>`,
    to: input.email,
    subject: approved
      ? `WASPI membership approved · ${input.trackingNumber}`
      : `WASPI receipt declined · ${input.trackingNumber}`,
    html,
  })
}
