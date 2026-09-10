import { NextResponse } from "next/server"
import { createSupabaseAuthClient } from "@/lib/supabase-auth-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
    }

    const supabase = createSupabaseAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!data.session || !data.user) {
      return NextResponse.json({ error: "Login failed." }, { status: 401 })
    }

    return NextResponse.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type || "bearer",
        user: data.user,
      },
    })
  } catch (error) {
    console.error("Auth login proxy error:", error)
    return NextResponse.json(
      { error: "Could not reach the authentication service. Please try again." },
      { status: 502 }
    )
  }
}
