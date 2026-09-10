import { notFound } from "next/navigation"
import { Suspense } from "react"
import EventRegisterPage from "@/components/register-page"
import { supabaseServer } from "@/lib/supabase-server"

const RESERVED = new Set([
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

export default async function EventSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const normalized = String(slug || "").trim().toLowerCase()

  if (!normalized || RESERVED.has(normalized) || normalized.includes(".")) {
    notFound()
  }

  const { data } = await supabaseServer
    .from("events")
    .select("id, magic_link")
    .eq("magic_link", normalized)
    .maybeSingle()

  if (!data?.magic_link) {
    notFound()
  }

  return (
    <Suspense fallback={null}>
      <EventRegisterPage eventRef={data.magic_link} />
    </Suspense>
  )
}
