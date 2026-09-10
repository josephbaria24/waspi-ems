export const RESERVED_EVENT_SLUGS = new Set([
  "api",
  "events",
  "login",
  "register",
  "membership",
  "settings",
  "submission",
  "evaluation",
  "favicon.ico",
  "_next",
])

export function normalizeRegistrationSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export function registrationPath(slug?: string) {
  if (!slug) return ""
  return `/${encodeURIComponent(slug)}`
}

export function normalizeSlugList(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  const seen = new Set<string>()
  const list: string[] = []
  for (const value of values) {
    const slug = normalizeRegistrationSlug(String(value || ""))
    if (!slug || slug.length < 3 || seen.has(slug)) continue
    seen.add(slug)
    list.push(slug)
  }
  return list
}
