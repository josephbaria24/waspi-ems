import { notFound } from "next/navigation"
import { Suspense } from "react"
import EventRegisterPage from "@/components/register-page"
import { RESERVED_EVENT_SLUGS, normalizeRegistrationSlug } from "@/lib/event-slugs"
import { supabaseServer } from "@/lib/supabase-server"

async function findEventBySlug(slug: string) {
  const { data: byPrimary } = await supabaseServer
    .from("events")
    .select("id, magic_link, magic_link_aliases")
    .eq("magic_link", slug)
    .maybeSingle()

  if (byPrimary?.magic_link) return byPrimary

  const { data: byAlias, error } = await supabaseServer
    .from("events")
    .select("id, magic_link, magic_link_aliases")
    .contains("magic_link_aliases", [slug])
    .maybeSingle()

  if (error) {
    // Column may not exist yet — ignore and treat as not found.
    console.error("Alias slug lookup error:", error.message)
    return null
  }

  return byAlias
}

export default async function EventSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const normalized = normalizeRegistrationSlug(slug)

  if (!normalized || RESERVED_EVENT_SLUGS.has(normalized) || String(slug || "").includes(".")) {
    notFound()
  }

  const data = await findEventBySlug(normalized)

  if (!data?.magic_link) {
    notFound()
  }

  return (
    <Suspense fallback={null}>
      <EventRegisterPage eventRef={data.magic_link} />
    </Suspense>
  )
}
