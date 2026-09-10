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

/** PostgREST needs a JSON value for jsonb `cs` — a JS array can be sent as `{slug}` and fail. */
export function aliasesContainsFilter(slug: string) {
  return JSON.stringify([normalizeRegistrationSlug(slug)])
}

export function eventHasSlug(
  event: { magic_link?: string | null; magic_link_aliases?: unknown },
  slug: string,
) {
  const normalized = normalizeRegistrationSlug(slug)
  if (!normalized) return false
  if (normalizeRegistrationSlug(String(event.magic_link || "")) === normalized) return true
  return normalizeSlugList(event.magic_link_aliases).includes(normalized)
}
