import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

const ROLES = ["Admin", "Organizer", "Staff"] as const

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

function roleOf(user: { user_metadata?: Record<string, unknown> }) {
  const role = String(user.user_metadata?.role || "Admin")
  return ROLES.includes(role as (typeof ROLES)[number]) ? role : "Admin"
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (auth.error) return auth.error

  const { data, error } = await supabaseServer.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const users = (data.users || []).map((user) => ({
    id: user.id,
    email: user.email || "",
    name: String(user.user_metadata?.full_name || user.user_metadata?.name || ""),
    role: roleOf(user),
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
  }))

  return NextResponse.json({ users, currentUserId: auth.user.id })
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (auth.error) return auth.error

  const body = await req.json()
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  const name = String(body.name || "").trim()
  const role = ROLES.includes(body.role) ? body.role : "Staff"

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
  }

  const { data, error } = await supabaseServer.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name,
      role,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser(req)
  if (auth.error) return auth.error

  const body = await req.json()
  const id = String(body.id || "")
  if (!id) return NextResponse.json({ error: "User id is required." }, { status: 400 })

  const { data: existing, error: lookupError } = await supabaseServer.auth.admin.getUserById(id)
  if (lookupError || !existing.user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const updates: { password?: string; user_metadata?: Record<string, unknown> } = {}

  if (body.password) {
    const password = String(body.password)
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
    }
    updates.password = password
  }

  if (body.role || body.name !== undefined) {
    const role = body.role && ROLES.includes(body.role) ? body.role : roleOf(existing.user)
    const name = body.name !== undefined ? String(body.name || "").trim() : String(existing.user.user_metadata?.full_name || "")
    updates.user_metadata = {
      ...(existing.user.user_metadata || {}),
      full_name: name,
      role,
    }
  }

  if (!updates.password && !updates.user_metadata) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 })
  }

  const { error } = await supabaseServer.auth.admin.updateUserById(id, updates)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req)
  if (auth.error) return auth.error

  const id = new URL(req.url).searchParams.get("id") || ""
  if (!id) return NextResponse.json({ error: "User id is required." }, { status: 400 })
  if (id === auth.user.id) {
    return NextResponse.json({ error: "You cannot delete the account you are signed in with." }, { status: 400 })
  }

  const { error } = await supabaseServer.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
