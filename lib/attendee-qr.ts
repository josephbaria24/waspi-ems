export type AttendeeQrInput = {
  referenceId?: string | null
  name: string
  email?: string | null
  attendeeId?: number | null
}

export type ParsedAttendeeQr = {
  referenceId: string
  name?: string
  email?: string
  attendeeId?: number
}

type AttendeeIdentity = {
  id?: number
  personal_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  email?: string | null
  reference_id?: string | null
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim()
}

export function attendeeDisplayName(row: {
  personal_name?: string | null
  middle_name?: string | null
  last_name?: string | null
}) {
  return [row.personal_name, row.middle_name, row.last_name].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
}

export function buildAttendeeQrValue(input: AttendeeQrInput) {
  return JSON.stringify({
    v: 1,
    id: input.attendeeId ?? null,
    ref: String(input.referenceId || "").trim(),
    name: input.name.trim(),
    email: String(input.email || "").trim(),
  })
}

export function parseAttendeeQr(raw: string): ParsedAttendeeQr {
  const value = String(raw || "").trim()
  if (!value) return { referenceId: "" }

  if (value.startsWith("{")) {
    try {
      const data = JSON.parse(value) as {
        id?: number | string | null
        ref?: string
        reference_id?: string
        name?: string
        email?: string
      }
      const id = Number(data.id)
      return {
        referenceId: String(data.ref || data.reference_id || "").trim(),
        name: data.name ? String(data.name).trim() : undefined,
        email: data.email ? String(data.email).trim() : undefined,
        attendeeId: Number.isFinite(id) && id > 0 ? id : undefined,
      }
    } catch {
      // Older codes and plain text fall through.
    }
  }

  const fromUrl = value.match(/\/submission\/([^/?#]+)/i)?.[1]
  return { referenceId: decodeURIComponent(fromUrl || value).trim() }
}

export function namesMatch(
  row: { personal_name?: string | null; middle_name?: string | null; last_name?: string | null },
  qrName: string,
) {
  const target = normalize(qrName)
  if (!target) return false
  const firstLast = normalize(`${row.personal_name || ""} ${row.last_name || ""}`)
  const full = normalize(attendeeDisplayName(row))
  const lastFirst = normalize(`${row.last_name || ""}, ${row.personal_name || ""}`)
  return target === firstLast || target === full || target === lastFirst
}

export function chooseAttendee<T extends AttendeeIdentity>(
  rows: T[],
  parsed: ParsedAttendeeQr,
): { attendee?: T; error?: string } {
  if (parsed.attendeeId) {
    const byId = rows.find((row) => Number(row.id) === parsed.attendeeId)
    if (byId) return { attendee: byId }
  }

  let pool = rows
  if (parsed.referenceId) {
    pool = rows.filter(
      (row) => normalize(String(row.reference_id || "")) === normalize(parsed.referenceId),
    )
  }

  if (parsed.email) {
    const byEmail = pool.filter((row) => normalize(String(row.email || "")) === normalize(parsed.email || ""))
    if (byEmail.length === 1) return { attendee: byEmail[0] }
    if (byEmail.length > 1 && parsed.name) {
      const named = byEmail.filter((row) => namesMatch(row, parsed.name || ""))
      if (named.length === 1) return { attendee: named[0] }
    }
  }

  if (parsed.name) {
    const byName = pool.filter((row) => namesMatch(row, parsed.name || ""))
    if (byName.length === 1) return { attendee: byName[0] }
    if (byName.length > 1) {
      return { error: `More than one attendee is named ${parsed.name}. Use the QR sent to their own email.` }
    }
    if (pool.length === 1) return { attendee: pool[0] }
    if (pool.length > 1) {
      return {
        error: `This code is shared. The name on the QR (${parsed.name}) did not match one person.`,
      }
    }
  }

  if (pool.length === 1) return { attendee: pool[0] }
  if (pool.length > 1) {
    return {
      error: "This code is shared by more than one attendee. Resend their QR so it includes their own name.",
    }
  }

  return { error: "Attendee not found or not registered for this event" }
}
