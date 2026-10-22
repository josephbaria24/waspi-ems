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
        block("heading", { text: "Hi, {{name}}!" }),
        block("paragraph", {
          text: "We have received your registration for the <strong>{{event_name}}</strong>.",
        }),
        block("paragraph", {
          text: "You may view your submission / QR code details by clicking the button below:",
        }),
        block("button", { label: "View Submission", url: "{{link}}", tone: "primary" }),
        block("paragraph", {
          text: "Kindly present your submission details on the day of the event to confirm your attendance.",
        }),
        block("divider"),
        block("qr"),
        block("info", { text: "Event: {{event_name}}\nVenue: {{venue}}\nReference ID: {{reference_id}}" }),
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
        block("heading", { text: "Hi, {{name}}!" }),
        block("paragraph", {
          text: "Congratulations for completing the <strong>{{event_name}}</strong>.",
        }),
        block("paragraph", {
          text: "We would like to invite you to complete an evaluation about the said Conference. Once done, you will receive another email with your digital certificate copy.",
        }),
        block("paragraph", { text: "You may take the evaluation by clicking the button below. Thank you!" }),
        block("button", { label: "Take Evaluation", url: "{{eval_link}}", tone: "dark" }),
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
        block("heading", { text: "Congratulations, {{name}}!" }),
        block("paragraph", {
          text: "Thank you for completing the evaluation for <strong>{{event_name}}</strong>.",
        }),
        block("paragraph", {
          text: "Please find attached your <strong>Certificate of Participation</strong>.",
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
        block("heading", { text: "Congratulations, {{name}}!" }),
        block("paragraph", {
          text: "Please find attached your <strong>Certificate of {{certificate_label}}</strong> for <strong>{{event_name}}</strong>.",
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

function buttonColor(tone?: EmailBlock["tone"]) {
  if (tone === "dark") return "#0B1F14"
  if (tone === "muted") return "#8D959D"
  return "#00D47E"
}

function buttonTextColor(tone?: EmailBlock["tone"]) {
  if (tone === "primary") return "#0B1F14"
  return "#ffffff"
}

export function renderEmailBlocksHtml(
  blocks: EmailBlock[],
  vars: EmailVars,
  options?: { qrDataUrl?: string; logoUrl?: string; preview?: boolean },
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
          <div style="text-align:center;padding:8px 0 16px;">
            <img src="${logoUrl}" alt="WASPI" style="max-height:64px;width:auto;" />
          </div>`
      case "heading":
        return `<h2 style="margin:0 0 12px;color:#0B1F14;font-size:22px;">${text}</h2>`
      case "paragraph":
        return `<p style="margin:0 0 14px;color:#333;line-height:1.55;font-size:15px;">${text}</p>`
      case "button":
        return `
          <div style="text-align:center;margin:20px 0;">
            <a href="${url}" style="display:inline-block;background:${buttonColor(blockItem.tone)};color:${buttonTextColor(blockItem.tone)};padding:12px 22px;text-decoration:none;border-radius:8px;font-weight:700;">
              ${label || "Open"}
            </a>
          </div>`
      case "divider":
        return `<hr style="border:none;border-top:1px solid #E8EAEB;margin:22px 0;" />`
      case "info":
        return `
          <div style="background:#F7FBF8;border:1px solid #E8EAEB;border-radius:10px;padding:14px;margin:14px 0;color:#1E1E1E;font-size:14px;white-space:pre-line;">
            ${text}
          </div>`
      case "qr":
        if (!options?.qrDataUrl) {
          return `<p style="color:#8D959D;font-size:13px;">[QR code will appear here when sent]</p>`
        }
        return `
          <div style="margin:16px 0;">
            <img src="${options.qrDataUrl}" alt="QR Code" width="120" height="120" style="display:block;" />
          </div>`
      case "footer":
        return `<p style="margin-top:28px;color:#666;font-size:13px;">${text}<br/>© ${vars.year || new Date().getFullYear()} WASPI. All rights reserved.</p>`
      default:
        return ""
    }
  })

  return `
    <div style="font-family:Arial,sans-serif;background:#F7FBF8;padding:24px;">
      <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #E8EAEB;">
        ${parts.join("\n")}
      </div>
    </div>
  `
}

export function renderEmailTemplate(
  template: EmailTemplate,
  vars: EmailVars,
  options?: { qrDataUrl?: string; logoUrl?: string; preview?: boolean },
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
