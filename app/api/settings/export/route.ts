import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

async function requireUser(req: NextRequest) {
  const header = req.headers.get("authorization") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (!token) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) }

  const { data, error } = await supabaseServer.auth.getUser(token)
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 }) }
  }

  return { user: data.user }
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (value: unknown) => {
    const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value)
    return `"${text.replace(/"/g, '""')}"`
  }
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n")
}

function fileResponse(body: string, filename: string, type: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (auth.error) return auth.error

  const type = new URL(req.url).searchParams.get("type") || "backup"
  const stamp = new Date().toISOString().slice(0, 10)

  if (type === "events" || type === "attendees" || type === "members") {
    const table = type === "members" ? "members" : type
    const { data, error } = await supabaseServer.from(table).select("*")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return fileResponse(toCsv((data || []) as Record<string, unknown>[]), `waspi-${type}-${stamp}.csv`, "text/csv; charset=utf-8")
  }

  const [events, attendees, members, profiles] = await Promise.all([
    supabaseServer.from("events").select("*"),
    supabaseServer.from("attendees").select("*"),
    supabaseServer.from("members").select("*"),
    supabaseServer.from("profiles").select("*"),
  ])

  const failed = [events.error, attendees.error, members.error, profiles.error].find(Boolean)
  if (failed) return NextResponse.json({ error: failed.message }, { status: 500 })

  const backup = {
    exportedAt: new Date().toISOString(),
    events: events.data || [],
    attendees: attendees.data || [],
    members: members.data || [],
    profiles: profiles.data || [],
  }

  return fileResponse(JSON.stringify(backup, null, 2), `waspi-backup-${stamp}.json`, "application/json")
}
