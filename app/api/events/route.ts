import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

async function saveCoverImage(eventId: number, coverImage: string) {
  if (!coverImage) return null
  if (!coverImage.startsWith("data:")) return coverImage

  const dataUrl = coverImage.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/)
  if (!dataUrl) return null

  const filePath = `featured-image/${eventId}-${Date.now()}.jpg`
  const { error: uploadError } = await supabaseServer.storage
    .from("certificates")
    .upload(filePath, Buffer.from(dataUrl[1], "base64"), {
      contentType: "image/jpeg",
      upsert: true,
    })

  if (uploadError) {
    console.error("Cover upload error:", uploadError)
    return null
  }

  const { data: publicData } = supabaseServer.storage.from("certificates").getPublicUrl(filePath)
  return publicData.publicUrl
}

function makeMagicLink() {
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

async function nextEventId() {
  const { data, error } = await supabaseServer
    .from("events")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return Number(data?.id || 0) + 1
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body.name || "").trim()
    const type = String(body.type || "Conference").trim()
    const venue = String(body.venue || "").trim()
    const price = Number(body.price) || 0
    const schedule = Array.isArray(body.schedule) ? body.schedule : []

    if (!name || !venue) {
      return NextResponse.json({ error: "Event name and venue are required." }, { status: 400 })
    }

    const dates = schedule
      .map((day: { date?: string }) => day?.date)
      .filter((date: string | undefined): date is string => Boolean(date))
      .sort()

    const topics = schedule.flatMap((day: { coveredTopics?: string[] }) => day.coveredTopics || [])
    const coverImage = typeof body.feature_image === "string" ? body.feature_image : ""
    const startDate = dates[0] ? new Date(dates[0]).toISOString() : new Date().toISOString()
    const endDate = dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toISOString() : startDate
    const id = await nextEventId()

    const { data, error } = await supabaseServer
      .from("events")
      .insert({
        id,
        name,
        type,
        price,
        venue,
        schedules: schedule,
        topics,
        start_date: startDate,
        end_date: endDate,
        magic_link: makeMagicLink(),
        status: "active",
      })
      .select("*")
      .single()

    if (error) {
      console.error("Create event error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const featureImage = await saveCoverImage(data.id, coverImage)
    if (featureImage) {
      await supabaseServer.from("events").update({ feature_image: featureImage }).eq("id", data.id)
    }

    return NextResponse.json({ event: { ...data, feature_image: featureImage } })
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ error: "Failed to create event." }, { status: 500 })
  }
}

const STATUS_BY_ACTION: Record<string, string> = {
  archive: "archived",
  activate: "active",
  deactivate: "inactive",
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = Number(body.id)
    const action = String(body.action || "")
    const status = STATUS_BY_ACTION[action]

    if (!id || !status) {
      return NextResponse.json({ error: "Invalid event action." }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from("events")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, status")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ event: data })
  } catch (error) {
    console.error("Update event error:", error)
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const id = Number(body.id)
    const name = String(body.name || "").trim()
    const type = String(body.type || "Conference").trim()
    const venue = String(body.venue || "").trim()
    const price = Number(body.price) || 0
    const description = String(body.description || "").trim()
    const schedule = Array.isArray(body.schedule) ? body.schedule : []

    if (!id || !name || !venue) {
      return NextResponse.json({ error: "Event name and venue are required." }, { status: 400 })
    }

    const dates = schedule
      .map((day: { date?: string }) => day?.date)
      .filter((date: string | undefined): date is string => Boolean(date))
      .sort()

    const topics = schedule.flatMap((day: { coveredTopics?: string[] }) => day.coveredTopics || [])
    const startDate = dates[0] ? new Date(dates[0]).toISOString() : new Date().toISOString()
    const endDate = dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toISOString() : startDate
    const featureImage = await saveCoverImage(id, typeof body.feature_image === "string" ? body.feature_image : "")

    const { data, error } = await supabaseServer
      .from("events")
      .update({
        name,
        type,
        price,
        venue,
        description,
        schedules: schedule,
        topics,
        start_date: startDate,
        end_date: endDate,
        feature_image: featureImage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ event: data })
  } catch (error) {
    console.error("Update event details error:", error)
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get("id"))
    if (!id) {
      return NextResponse.json({ error: "Event id is required." }, { status: 400 })
    }

    await supabaseServer.from("certificate_templates").delete().eq("event_id", id)
    await supabaseServer.from("attendees").delete().eq("event_id", id)

    const { error } = await supabaseServer.from("events").delete().eq("id", id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete event error:", error)
    return NextResponse.json({ error: "Failed to delete event." }, { status: 500 })
  }
}
