/** Local calendar day, YYYY-MM-DD. */
export function localDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Epoch the attendance table uses for a date-only schedule value. */
export function scheduleDateEpoch(date: string) {
  const key = date.slice(0, 10)
  return new Date(key).getTime()
}

function epochToLocalKey(epoch: number) {
  return localDateKey(new Date(epoch))
}

function epochToUtcKey(epoch: number) {
  const d = new Date(epoch)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** True when a stored attendance timestamp is the same calendar day as a schedule date. */
export function attendanceMatchesDate(recordDate: number, scheduleDate: string) {
  const key = scheduleDate.slice(0, 10)
  if (!Number.isFinite(recordDate)) return false
  if (recordDate === scheduleDateEpoch(key)) return true
  // QR scans previously stored local midnight, which differs from date-only UTC midnight.
  if (epochToLocalKey(recordDate) === key) return true
  if (epochToUtcKey(recordDate) === key) return true
  return false
}
