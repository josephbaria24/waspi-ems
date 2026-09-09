import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : ""

    if (!token) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabaseServer.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 })
    }

    const userId = userData.user.id

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError) throw profileError

    const { data: member, error: memberError } = await supabaseServer
      .from("members")
      .select("*")
      .eq("profile_id", userId)
      .single()

    if (memberError) {
      return NextResponse.json(
        { error: "No membership record found. Please register first." },
        { status: 404 }
      )
    }

    const { data: documents } = await supabaseServer
      .from("member_documents")
      .select("file_url, uploaded_at")
      .eq("member_id", member.id)
      .eq("document_type", "receipt")
      .order("uploaded_at", { ascending: true })

    const receipts = (documents || []).map((doc) => ({
      url: doc.file_url,
      uploadedAt: doc.uploaded_at,
    }))
    if (!receipts.length && member.receipt_url) {
      receipts.push({ url: member.receipt_url, uploadedAt: member.receipt_uploaded_at })
    }

    return NextResponse.json({
      profile: {
        fullName: profile.full_name,
        email: userData.user.email,
        phone: profile.phone_number,
        company: profile.company,
        position: profile.position,
      },
      membership: {
        id: member.id,
        trackingNumber: member.tracking_number,
        type: member.membership_type,
        status: member.status,
        paymentStatus: member.payment_status,
        receiptUrl: member.receipt_url,
        receipts,
        declineReason: member.payment_details?.decline_reason || null,
        receiptUploadedAt: member.receipt_uploaded_at,
        expiryDate: member.expiry_date,
        createdAt: member.created_at,
      },
    })
  } catch (error: any) {
    console.error("Membership session error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to restore session" },
      { status: 500 }
    )
  }
}
