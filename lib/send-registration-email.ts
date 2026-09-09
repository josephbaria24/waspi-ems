import nodemailer from "nodemailer"
import { getMembershipSettings } from "@/lib/membership-settings-store"
import { formatPeso, getPlan } from "@/lib/membership-settings"

export type RegistrationEmailInput = {
  email: string
  fullName: string
  trackingNumber: string
  membershipType: string
  paymentMethod?: string
  wantsPhysicalId?: boolean
  physicalIdFee?: number
  shippingFee?: number
  totalDue?: number
  deliveryAddress?: string
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function paymentLabel(method?: string) {
  if (method === "ewallet") return "E-wallet (GCash/Maya)"
  if (method === "bank") return "Bank Transfer"
  if (method === "cash") return "Cash (In-person)"
  return method || "Pending"
}

export async function sendRegistrationEmail(input: RegistrationEmailInput) {
  const membershipSettings = await getMembershipSettings()
  const plan = getPlan(membershipSettings, input.membershipType)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://waspi.ph").replace(/\/$/, "")
  const uploadReceiptUrl = `${siteUrl}/membership/upload-receipt?tracking=${encodeURIComponent(input.trackingNumber)}`
  const fullName = escapeHtml(input.fullName)
  const trackingNumber = escapeHtml(input.trackingNumber)
  const totalDue = formatPeso(Number(input.totalDue ?? plan.price))

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

  const html = `
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Segoe UI,Arial,sans-serif;">
      <div style="background:#00D47E;padding:32px 28px;text-align:center;">
        <h1 style="color:#0B1F14;margin:0;font-size:26px;">WASPI Membership</h1>
        <p style="color:#0B1F14;margin:8px 0 0;font-size:15px;">Your registration summary</p>
      </div>
      <div style="padding:28px;">
        <p style="font-size:16px;color:#1E1E1E;">Hi <strong>${fullName}</strong>,</p>
        <p style="font-size:14px;color:#555;line-height:1.6;">
          We received your WASPI membership registration. Keep your transaction number and upload your payment receipt using the link below.
        </p>

        <div style="background:#f0fdf4;border:2px dashed #16a35c;border-radius:10px;padding:20px;text-align:center;margin:24px 0;">
          <p style="font-size:12px;color:#777;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Transaction / Tracking Number</p>
          <p style="font-size:26px;font-weight:bold;color:#16a35c;margin:0;font-family:Courier New,monospace;">${trackingNumber}</p>
        </div>

        <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="font-size:13px;color:#777;margin:0 0 12px;font-weight:600;text-transform:uppercase;">Registration summary</p>
          <table style="width:100%;font-size:14px;color:#444;" cellpadding="4" cellspacing="0">
            <tr><td style="color:#888;width:150px;">Name</td><td style="font-weight:600;">${fullName}</td></tr>
            <tr><td style="color:#888;">Email</td><td style="font-weight:600;">${escapeHtml(input.email)}</td></tr>
            <tr><td style="color:#888;">Membership</td><td style="font-weight:600;">${escapeHtml(plan.name)}</td></tr>
            <tr><td style="color:#888;">Membership fee</td><td style="font-weight:600;">${formatPeso(plan.price)}</td></tr>
            ${input.wantsPhysicalId ? `
            <tr><td style="color:#888;">Physical ID</td><td style="font-weight:600;">${formatPeso(Number(input.physicalIdFee || 0))}</td></tr>
            <tr><td style="color:#888;">Shipping</td><td style="font-weight:600;">${formatPeso(Number(input.shippingFee || 0))}</td></tr>
            <tr><td style="color:#888;vertical-align:top;">Delivery</td><td>${escapeHtml(input.deliveryAddress || "—")}</td></tr>
            ` : ""}
            <tr><td style="color:#888;">Payment method</td><td style="font-weight:600;">${escapeHtml(paymentLabel(input.paymentMethod))}</td></tr>
            <tr><td style="color:#888;">Total due</td><td style="font-weight:700;color:#16a35c;">${totalDue}</td></tr>
          </table>
        </div>

        ${input.paymentMethod === "bank" ? `
        <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="font-size:13px;font-weight:600;color:#555;margin:0 0 10px;">Bank transfer details</p>
          <table style="width:100%;font-size:13px;" cellpadding="4" cellspacing="0">
            <tr><td style="color:#888;width:150px;vertical-align:top;">Bank / Branch</td><td style="font-weight:600;">Landbank of the Philippines / Davao City</td></tr>
            <tr><td style="color:#888;vertical-align:top;">Savings Account Name</td><td style="font-weight:600;">Workplace Advocates on Safety in the Philippines, Inc.</td></tr>
            <tr><td style="color:#888;vertical-align:top;">Bank Account Number</td><td style="font-family:Courier New,monospace;font-weight:600;">5911-0175-73</td></tr>
          </table>
        </div>
        ` : ""}

        <div style="background:#FFFBEB;border:2px solid #F59E0B;border-radius:10px;padding:24px;margin:24px 0;text-align:center;">
          <p style="font-size:16px;font-weight:700;color:#92400E;margin:0 0 8px;">Upload your payment receipt</p>
          <p style="font-size:13px;color:#78350F;margin:0 0 16px;line-height:1.6;">
            After you pay, submit a photo or screenshot of your receipt so we can confirm your membership.
          </p>
          <a href="${uploadReceiptUrl}" style="display:inline-block;background:#00D47E;color:#0B1F14;padding:14px 28px;text-decoration:none;border-radius:999px;font-weight:bold;font-size:15px;">
            Submit receipt
          </a>
          <p style="font-size:12px;color:#92400E;margin:14px 0 0;word-break:break-all;">${escapeHtml(uploadReceiptUrl)}</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: `"${fromName}" <no-reply@waspi.ph>`,
    to: input.email,
    subject: `WASPI registration summary · ${input.trackingNumber}`,
    html,
  })
}
