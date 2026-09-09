import { NextResponse } from "next/server"
import { getMembershipSettings, saveMembershipSettings } from "@/lib/membership-settings-store"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const settings = await getMembershipSettings()
    return NextResponse.json(
      { settings },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load membership settings" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const settings = await saveMembershipSettings(body.settings || body)
    return NextResponse.json({ settings })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save membership settings" },
      { status: 500 }
    )
  }
}
