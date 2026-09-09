import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

type NotificationItem = {
  id: string
  type: "registration" | "receipt" | "attendee"
  title: string
  description: string
  createdAt: string
  href: string
}

export async function GET() {
  try {
    const items: NotificationItem[] = []

    const { data: members, error: membersError } = await supabaseServer
      .from("members")
      .select(`
        id,
        tracking_number,
        membership_type,
        status,
        payment_status,
        receipt_url,
        receipt_uploaded_at,
        created_at,
        profiles:profile_id (full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(30)

    if (membersError) throw membersError

    for (const member of members || []) {
      const name = (member as any).profiles?.full_name || "New member"
      const tracking = member.tracking_number || "No tracking number"

      if (member.created_at) {
        items.push({
          id: `registration-${member.id}`,
          type: "registration",
          title: "New membership registration",
          description: `${name} registered (${member.membership_type || "membership"}) · ${tracking}`,
          createdAt: member.created_at,
          href: "/membership/admin",
        })
      }

      if (member.receipt_uploaded_at) {
        items.push({
          id: `receipt-${member.id}`,
          type: "receipt",
          title: "Payment receipt uploaded",
          description: `${name} uploaded a receipt · ${member.payment_status || "Under Review"}`,
          createdAt: member.receipt_uploaded_at,
          href: "/membership/admin",
        })
      }
    }

    const { data: attendees, error: attendeesError } = await supabaseServer
      .from("attendees")
      .select("id, personal_name, last_name, email, event_id, created_at, events(name)")
      .order("created_at", { ascending: false })
      .limit(20)

    if (!attendeesError) {
      for (const attendee of attendees || []) {
        if (!attendee.created_at) continue
        const name = `${attendee.personal_name || ""} ${attendee.last_name || ""}`.trim() || attendee.email || "Attendee"
        const eventRow = (attendee as any).events
        const eventName = (Array.isArray(eventRow) ? eventRow[0]?.name : eventRow?.name) || "an event"
        items.push({
          id: `attendee-${attendee.id}`,
          type: "attendee",
          title: "Event registration",
          description: `${name} registered for ${eventName}`,
          createdAt: attendee.created_at,
          href: attendee.event_id ? `/events/${attendee.event_id}` : "/events",
        })
      }
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ notifications: items.slice(0, 40) })
  } catch (error: any) {
    console.error("Notifications error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to load notifications" },
      { status: 500 }
    )
  }
}
