function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function formatClock12(value?: string) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return ""
  let hour = Number(match[1])
  if (!Number.isFinite(hour)) return ""
  const suffix = hour >= 12 ? "PM" : "AM"
  hour = hour % 12 || 12
  return `${hour}:${match[2]} ${suffix}`
}

type AgendaDay = {
  date?: string
  timeIn?: string
  timeOut?: string
  coveredTopics?: string[]
}

export function formatAgendaHtml(schedules: unknown) {
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return `<p style="margin:0;color:#8D959D;font-size:14px;">Schedule will be announced at the venue.</p>`
  }

  const rows = (schedules as AgendaDay[])
    .map((item, index) => {
      const rawDate = String(item?.date || "").slice(0, 10)
      const dateLabel = rawDate
        ? new Date(`${rawDate}T12:00:00`).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : `Day ${index + 1}`
      const start = formatClock12(item?.timeIn)
      const end = formatClock12(item?.timeOut)
      const time = [start, end].filter(Boolean).join(" – ")
      const topics = Array.isArray(item?.coveredTopics)
        ? item.coveredTopics.map((topic) => String(topic).trim()).filter(Boolean)
        : []
      const topicHtml = topics
        .map(
          (topic) =>
            `<span style="display:inline-block;margin:6px 6px 0 0;padding:4px 10px;border-radius:999px;background:#00D47E;color:#0B1F14;font-size:12px;font-weight:700;">${escapeHtml(topic)}</span>`,
        )
        .join("")

      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #E3EFE8;">
            <div style="font-size:15px;font-weight:700;color:#0B1F14;">${escapeHtml(dateLabel)}</div>
            ${time ? `<div style="margin-top:4px;font-size:14px;color:#017C7C;font-weight:700;">${escapeHtml(time)}</div>` : ""}
            ${topicHtml ? `<div>${topicHtml}</div>` : ""}
          </td>
        </tr>`
    })
    .join("")

  return `<table class="waspi-agenda" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">${rows}</table>`
}
