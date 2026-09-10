import { notFound } from "next/navigation"
import { Suspense } from "react"
import EventRegisterPage from "@/components/register-page"
import {
  RESERVED_EVENT_SLUGS,
  aliasesContainsFilter,
  eventHasSlug,
  normalizeRegistrationSlug,
} from "@/lib/event-slugs"
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
    .filter("magic_link_aliases", "cs", aliasesContainsFilter(slug))
    .maybeSingle()

  if (byAlias?.magic_link) return byAlias

  if (error) {
    console.error("Alias slug lookup error:", error.message)
  }

  // Fallback when jsonb `cs` filter fails — match aliases in app code.
  const { data: rows } = await supabaseServer
    .from("events")
    .select("id, magic_link, magic_link_aliases")
    .limit(500)

  return (rows || []).find((row) => eventHasSlug(row, slug)) || null
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
