export type EmailStatusKey =
  | "qr"
  | "qr_resent"
  | "event_info"
  | "evaluation"
  | "direct_certificate"
  | "certificate"

export type EmailStatus = Partial<Record<EmailStatusKey, boolean>>

const TAGS: { key: EmailStatusKey; label: string; className: string }[] = [
  { key: "qr", label: "QR sent", className: "bg-sky-100 text-sky-800" },
  { key: "qr_resent", label: "QR resent", className: "bg-[#E8F5F5] text-[#017C7C]" },
  { key: "event_info", label: "Event info", className: "bg-amber-100 text-amber-800" },
  { key: "evaluation", label: "Eval sent", className: "bg-emerald-100 text-emerald-800" },
  { key: "direct_certificate", label: "Direct certificate", className: "bg-violet-100 text-violet-800" },
  { key: "certificate", label: "Certificate sent", className: "bg-rose-100 text-rose-800" },
]

export function mergeEmailStatus(a?: EmailStatus | null, b?: EmailStatus | null): EmailStatus {
  const next: EmailStatus = {}
  for (const tag of TAGS) {
    if (a?.[tag.key] || b?.[tag.key]) next[tag.key] = true
  }
  return next
}

const LOCAL_KEY = "waspi-email-status"

export function readLocalEmailStatus(): Record<string, EmailStatus> {
  if (typeof window === "undefined") return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "{}")
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function rememberEmailStatus(ids: number[], patch: EmailStatus) {
  if (typeof window === "undefined") return
  const all = readLocalEmailStatus()
  for (const id of ids) {
    all[String(id)] = mergeEmailStatus(all[String(id)], patch)
  }
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(all))
}

export function emailStatusTags(status?: EmailStatus | null, evaluated?: boolean) {
  const flags: EmailStatus = { ...(status || {}) }
  if (evaluated) flags.evaluation = true
  return TAGS.filter((tag) => flags[tag.key])
}

type StatusRow = { id: number; email_status?: EmailStatus | null }

export async function markAttendeeEmailStatus(client: any, ids: number[], key: EmailStatusKey) {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id)))]
  if (!unique.length) return

  const { data, error } = await client.from("attendees").select("id, email_status").in("id", unique)
  if (error) {
    console.error(
      "Could not save email tag. Run: alter table attendees add column if not exists email_status jsonb default '{}'::jsonb;",
      error.message,
    )
    return
  }

  await Promise.all(
    (data || []).map(async (row) => {
      const next: EmailStatus = { ...(row.email_status || {}), [key]: true }
      if (key === "qr_resent") next.qr = true
      const { error: updateError } = await client.from("attendees").update({ email_status: next }).eq("id", row.id)
      if (updateError) console.error("Could not save email tag:", updateError.message)
    }),
  )
}
