import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const accessToken = String(body.access_token || "")

    if (accessToken) {
      // Best-effort server revoke; client already clears local session.
      await Promise.race([
        supabaseServer.auth.admin.signOut(accessToken).catch(() => null),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Auth logout proxy error:", error)
    return NextResponse.json({ success: true })
  }
}
