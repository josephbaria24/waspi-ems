export type EmailBlockType =
  | "logo"
  | "heading"
  | "paragraph"
  | "button"
  | "divider"
  | "info"
  | "footer"
  | "qr"

export type EmailBlock = {
  id: string
  type: EmailBlockType
  text?: string
  label?: string
  url?: string
  tone?: "primary" | "dark" | "muted"
}

export type EmailTemplateKey =
  | "registration_confirmation"
  | "event_info"
  | "evaluation_invite"
  | "certificate_participation"
  | "certificate_direct"
  | "admin_notification"

export type EmailTemplate = {
  key: EmailTemplateKey
  name: string
  description: string
  enabled: boolean
  subject: string
  fromName: string
  blocks: EmailBlock[]
}

export type EmailTemplatesConfig = {
  order: EmailTemplateKey[]
  templates: Record<EmailTemplateKey, EmailTemplate>
}

export type EmailVars = Record<string, string>

export const EMAIL_VARIABLES = [
  { key: "name", label: "Full name" },
  { key: "first_name", label: "First name" },
  { key: "event_name", label: "Event name" },
  { key: "venue", label: "Venue" },
  { key: "reference_id", label: "Reference number" },
  { key: "link", label: "Registration link" },
  { key: "eval_link", label: "Evaluation link" },
  { key: "certificate_label", label: "Certificate type" },
  { key: "agenda", label: "Agenda and schedule" },
  { key: "year", label: "Current year" },
] as const

function uid(prefix = "b") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function block(type: EmailBlockType, data: Partial<EmailBlock> = {}): EmailBlock {
  return { id: uid(), type, ...data }
}

export function createDefaultEmailTemplates(): EmailTemplatesConfig {
  const templates: Record<EmailTemplateKey, EmailTemplate> = {
    registration_confirmation: {
      key: "registration_confirmation",
      name: "Registration confirmation",
      description: "Sent after an attendee registers for the event.",
      enabled: true,
      subject: "Your Registration for {{event_name}}",
      fromName: "WASPI Registration",
      blocks: [
        block("logo"),
        block("heading", { text: "Hi, {{name}}" }),
        block("paragraph", {
          text: "You're registered for <strong>{{event_name}}</strong>. Your entry QR code is below, and it belongs only to you.",
        }),
        block("button", { label: "View your ticket", url: "{{link}}", tone: "primary" }),
        block("paragraph", {
          text: "Bring this email, or the attached PNG or PDF, when you arrive.",
        }),
        block("qr"),
        block("info", { text: "Event: {{event_name}}\nVenue: {{venue}}\nReference: {{reference_id}}" }),
        block("footer", {
          text: "If you have any questions, please don't hesitate to contact info@waspi.ph.",
        }),
      ],
    },
    event_info: {
      key: "event_info",
      name: "Event info",
      description: "Sends the agenda, venue, and this attendee's personal QR code.",
      enabled: true,
      subject: "Event information - {{event_name}}",
      fromName: "WASPI",
      blocks: [
        block("logo"),
        block("heading", { text: "Hi, {{name}}" }),
        block("paragraph", {
          text: "Here are your details for <strong>{{event_name}}</strong>. The QR code in this email is issued only to you.",
        }),
        block("info", { text: "Venue: {{venue}}\nReference: {{reference_id}}\n\nAgenda:\n{{agenda}}" }),
        block("qr"),
        block("button", { label: "View your ticket", url: "{{link}}", tone: "primary" }),
        block("footer", {
          text: "If you have any questions, please don't hesitate to contact info@waspi.ph.",
        }),
      ],
    },
    evaluation_invite: {
      key: "evaluation_invite",
      name: "Evaluation invite",
      description: "Invite attendees to complete the evaluation form.",
      enabled: true,
      subject: "Evaluation Form - {{event_name}}",
      fromName: "WASPI",
      blocks: [
        block("logo"),
        block("heading", { text: "Hi, {{name}}" }),
        block("paragraph", {
          text: "Thank you for joining <strong>{{event_name}}</strong>. A short evaluation unlocks your certificate.",
        }),
        block("button", { label: "Take the evaluation", url: "{{eval_link}}", tone: "dark" }),
        block("footer", {
          text: "If you have any questions, please don't hesitate to contact info@waspi.ph.",
        }),
      ],
    },
    certificate_participation: {
      key: "certificate_participation",
      name: "Certificate (after evaluation)",
      description: "Sent with the participation certificate after evaluation.",
      enabled: true,
      subject: "Certificate of Participation - {{event_name}}",
      fromName: "WASPI",
      blocks: [
        block("logo"),
        block("heading", { text: "Congratulations, {{name}}" }),
        block("paragraph", {
          text: "Thank you for completing the evaluation for <strong>{{event_name}}</strong>. Your certificate is attached.",
        }),
        block("footer", {
          text: "If you have any questions, please don't hesitate to contact info@waspi.ph",
        }),
      ],
    },
    certificate_direct: {
      key: "certificate_direct",
      name: "Direct certificate",
      description: "Sent when certificates are emailed directly from Quick Actions / tools.",
      enabled: true,
      subject: "Certificate of {{certificate_label}} - {{event_name}}",
      fromName: "WASPI",
      blocks: [
        block("logo"),
        block("heading", { text: "Congratulations, {{name}}" }),
        block("paragraph", {
          text: "Your <strong>Certificate of {{certificate_label}}</strong> for <strong>{{event_name}}</strong> is attached.",
        }),
        block("footer", {
          text: "If you have any questions, please don't hesitate to contact info@waspi.ph.",
        }),
      ],
    },
    admin_notification: {
      key: "admin_notification",
      name: "Admin new registration",
      description: "Internal notice when someone registers for the event.",
      enabled: true,
      subject: "New Registration: {{name}} - {{event_name}}",
      fromName: "Event Registration System",
      blocks: [
        block("heading", { text: "New registration received" }),
        block("paragraph", {
          text: "<strong>{{name}}</strong> registered for <strong>{{event_name}}</strong>.",
        }),
        block("info", { text: "Email: {{link}}\nReference ID: {{reference_id}}\nVenue: {{venue}}" }),
        block("button", { label: "Open submission", url: "{{link}}", tone: "primary" }),
      ],
    },
  }

  return {
    order: [
      "registration_confirmation",
      "event_info",
      "evaluation_invite",
      "certificate_participation",
      "certificate_direct",
      "admin_notification",
    ],
    templates,
  }
}

export function normalizeEmailTemplatesConfig(raw: unknown): EmailTemplatesConfig {
  const defaults = createDefaultEmailTemplates()
  if (!raw || typeof raw !== "object") return defaults

  const data = raw as Partial<EmailTemplatesConfig>
  const order = Array.isArray(data.order)
    ? (data.order.filter((k) => k in defaults.templates) as EmailTemplateKey[])
    : defaults.order

  const mergedOrder = [...order]
  for (const key of defaults.order) {
    if (!mergedOrder.includes(key)) mergedOrder.push(key)
  }

  const templates = { ...defaults.templates }
  for (const key of defaults.order) {
    const incoming = data.templates?.[key]
    if (!incoming) continue
    templates[key] = {
      ...defaults.templates[key],
      ...incoming,
      key,
      blocks: Array.isArray(incoming.blocks) && incoming.blocks.length
        ? incoming.blocks.map((b) => ({ ...b, id: b.id || uid() }))
        : defaults.templates[key].blocks,
    }
  }

  return { order: mergedOrder, templates }
}

export function fillTemplate(input: string, vars: EmailVars) {
  return String(input || "").replace(/\{\{\s*([\w]+)\s*\}\}/g, (_, key: string) => {
    return vars[key] ?? ""
  })
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buttonColor(tone?: EmailBlock["tone"]) {
  if (tone === "dark") return "#0B1F14"
  if (tone === "muted") return "#8D959D"
  return "#00D47E"
}

function buttonTextColor(tone?: EmailBlock["tone"]) {
  if (tone === "primary") return "#0B1F14"
  return "#ffffff"
}

function renderInfoCard(text: string) {
  const chunks = text.split(/(<table class="waspi-agenda"[\s\S]*?<\/table>)/)
  const rows: string[] = []

  chunks.forEach((chunk, index) => {
    if (chunk.startsWith('<table class="waspi-agenda"')) {
      rows.push(`<div style="padding:8px 0 4px;">${chunk}</div>`)
      return
    }

    const nextIsAgenda = chunks[index + 1]?.startsWith('<table class="waspi-agenda"')
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    for (const line of lines) {
      if (nextIsAgenda && /^agenda:?$/i.test(line)) continue
      const labeled = line.match(/^([^:]{2,32}):\s*(.+)$/)
      if (labeled) {
        rows.push(`
          <div style="padding:12px 0;border-bottom:1px solid #E3EFE8;">
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#017C7C;font-weight:700;">${escapeHtml(labeled[1])}</div>
            <div style="margin-top:3px;font-size:15px;line-height:1.45;color:#0B1F14;">${escapeHtml(labeled[2])}</div>
          </div>`)
      } else {
        rows.push(`<p style="margin:10px 0;color:#1E1E1E;font-size:14px;line-height:1.5;">${escapeHtml(line)}</p>`)
      }
    }
  })

  if (!rows.length) return ""
  return `<div style="margin:18px 0;padding:4px 16px 8px;background:#F7FBF8;border:1px solid #E3EFE8;border-radius:14px;">${rows.join("")}</div>`
}

export function renderEmailBlocksHtml(
  blocks: EmailBlock[],
  vars: EmailVars,
  options?: { qrDataUrl?: string; qrCid?: string; qrCaption?: string; bannerSrc?: string; logoUrl?: string; preview?: boolean },
) {
  const logoUrl =
    options?.logoUrl ||
    (options?.preview ? "/waspi-logo.png" : "https://waspi.ph/wp-content/uploads/2024/09/cropped-WASPI-Logo-Header-2024-515x84.png")

  const parts = blocks.map((blockItem) => {
    const text = fillTemplate(blockItem.text || "", vars)
    const label = fillTemplate(blockItem.label || "", vars)
    const url = fillTemplate(blockItem.url || "#", vars)

    switch (blockItem.type) {
      case "logo":
        return `
          <div style="text-align:center;padding:4px 0 18px;">
            <img src="${logoUrl}" alt="WASPI" style="max-height:52px;width:auto;border:0;" />
          </div>`
      case "heading":
        return `<h1 style="margin:0 0 10px;color:#0B1F14;font-size:26px;line-height:1.25;font-weight:700;">${text}</h1>`
      case "paragraph":
        return `<p style="margin:0 0 14px;color:#3d4742;line-height:1.6;font-size:15px;">${text}</p>`
      case "button":
        return `
          <div style="text-align:center;margin:22px 0;">
            <a href="${url}" style="display:inline-block;background:${buttonColor(blockItem.tone)};color:${buttonTextColor(blockItem.tone)};padding:13px 26px;text-decoration:none;border-radius:999px;font-weight:700;font-size:14px;">
              ${label || "Open"}
            </a>
          </div>`
      case "divider":
        return `<div style="height:1px;background:#E8EAEB;margin:22px 0;"></div>`
      case "info":
        return renderInfoCard(text)
      case "qr": {
        const qrSrc = options?.qrCid ? `cid:${options.qrCid}` : options?.qrDataUrl
        if (!qrSrc) {
          return `<p style="margin:0 0 14px;color:#8D959D;font-size:13px;">Your QR code will appear here when the email is sent.</p>`
        }
        return `
          <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:8px auto 18px;background:#F7FBF8;border:1px solid #D7EEE4;border-radius:16px;">
            <tr>
              <td style="padding:18px 28px 16px;text-align:center;">
                <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#017C7C;font-weight:700;">Your entry code</div>
                <img src="${qrSrc}" alt="${escapeHtml(options?.qrCaption || "QR Code")}" width="180" height="180" style="display:block;margin:12px auto 0;border:0;" />
                ${
                  options?.qrCaption
                    ? `<p style="margin:10px 0 0;color:#0B1F14;font-size:16px;font-weight:700;">${escapeHtml(options.qrCaption)}</p>`
                    : ""
                }
                <p style="margin:6px 0 0;color:#8D959D;font-size:12px;line-height:1.45;">Show this code at the entrance. A PNG and a PDF are attached.</p>
              </td>
            </tr>
          </table>`
      }
      case "footer":
        return `
          <p style="margin:26px 0 0;padding-top:16px;border-top:1px solid #E8EAEB;color:#8D959D;font-size:12px;line-height:1.5;text-align:center;">
            ${text}<br/>© ${vars.year || new Date().getFullYear()} WASPI
          </p>`
      default:
        return ""
    }
  })

  const banner = options?.bannerSrc
    ? `<img src="${escapeHtml(options.bannerSrc)}" alt="Event banner" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />`
    : ""

  return `
    <div style="margin:0;background:#EEF6F1;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:18px;border:1px solid #D7E5DC;overflow:hidden;">
        ${banner}
        <div style="padding:28px 28px 24px;">
          ${parts.join("\n")}
        </div>
      </div>
    </div>
  `
}

export function renderEmailTemplate(
  template: EmailTemplate,
  vars: EmailVars,
  options?: { qrDataUrl?: string; qrCid?: string; qrCaption?: string; bannerSrc?: string; logoUrl?: string; preview?: boolean },
) {
  const withYear = { year: String(new Date().getFullYear()), ...vars }
  return {
    subject: fillTemplate(template.subject, withYear),
    fromName: fillTemplate(template.fromName, withYear),
    html: renderEmailBlocksHtml(template.blocks, withYear, options),
  }
}

export function newEmailBlock(type: EmailBlockType): EmailBlock {
  switch (type) {
    case "heading":
      return block("heading", { text: "New heading" })
    case "paragraph":
      return block("paragraph", { text: "Write your message here. Use {{name}} or {{event_name}}." })
    case "button":
      return block("button", { label: "Click here", url: "{{link}}", tone: "primary" })
    case "info":
      return block("info", { text: "Label: value" })
    case "footer":
      return block("footer", { text: "If you have any questions, contact info@waspi.ph." })
    case "logo":
      return block("logo")
    case "qr":
      return block("qr")
    case "divider":
    default:
      return block("divider")
  }
}
