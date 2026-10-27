import { NextResponse } from "next/server"
import {
  createDefaultEmailTemplates,
  normalizeEmailTemplatesConfig,
  type EmailTemplatesConfig,
} from "@/lib/email-templates"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = Number(searchParams.get("eventId"))
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from("events")
      .select("id, email_templates, feature_image")
      .eq("id", eventId)
      .maybeSingle()

    if (error && error.message.toLowerCase().includes("email_templates")) {
      return NextResponse.json({
        config: createDefaultEmailTemplates(),
        warning:
          "Email templates need a database column. Run: alter table events add column if not exists email_templates jsonb default '{}'::jsonb;",
      })
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({
      config: normalizeEmailTemplatesConfig(data.email_templates),
      featureImage: data.feature_image || "",
    })
  } catch (error) {
    console.error("Get email templates error:", error)
    return NextResponse.json({ error: "Failed to load email templates" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const eventId = Number(body.eventId)
    const config = normalizeEmailTemplatesConfig(body.config) as EmailTemplatesConfig

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from("events")
      .update({
        email_templates: config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select("id, email_templates")
      .single()

    if (error && error.message.toLowerCase().includes("email_templates")) {
      return NextResponse.json(
        {
          error:
            "Email templates need a database column. Run: alter table events add column if not exists email_templates jsonb default '{}'::jsonb;",
          config,
        },
        { status: 400 },
      )
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      config: normalizeEmailTemplatesConfig(data.email_templates),
    })
  } catch (error) {
    console.error("Save email templates error:", error)
    return NextResponse.json({ error: "Failed to save email templates" }, { status: 500 })
  }
}
