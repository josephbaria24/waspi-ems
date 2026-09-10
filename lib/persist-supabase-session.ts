/** Persist a Supabase session in the browser without calling supabase.co (setSession would). */
export function getSupabaseAuthStorageKey() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  const projectRef = new URL(url).hostname.split(".")[0]
  return `sb-${projectRef}-auth-token`
}

export function persistSupabaseSession(session: {
  access_token: string
  refresh_token: string
  expires_at?: number
  expires_in?: number
  token_type?: string
  user: unknown
}) {
  const storageKey = getSupabaseAuthStorageKey()
  if (!storageKey || typeof window === "undefined") return

  const payload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type || "bearer",
    user: session.user,
  }

  window.localStorage.setItem(storageKey, JSON.stringify(payload))
}

export function clearSupabaseSession() {
  if (typeof window === "undefined") return

  const storageKey = getSupabaseAuthStorageKey()
  if (storageKey) {
    window.localStorage.removeItem(storageKey)
  }

  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i)
    if (key && (key.startsWith("sb-") || key.includes("supabase.auth"))) {
      window.localStorage.removeItem(key)
    }
  }
}
