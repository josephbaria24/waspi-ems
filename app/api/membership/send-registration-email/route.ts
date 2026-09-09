import { NextResponse } from "next/server"
import { sendRegistrationEmail } from "@/lib/send-registration-email"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.email || !body.trackingNumber) {
      return NextResponse.json({ error: "Email and tracking number are required" }, { status: 400 })
    }

    await sendRegistrationEmail(body)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Registration email error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
