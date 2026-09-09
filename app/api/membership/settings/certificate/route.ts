import { NextRequest, NextResponse } from "next/server"
import { uploadToFTP } from "@/lib/ftp-upload"
import { getMembershipSettings, saveMembershipSettings } from "@/lib/membership-settings-store"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Certificate image is required" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WebP certificate image." }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "png"
    const fileName = `membership-certificate-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const imageUrl = await uploadToFTP(buffer, fileName, "certificates")

    const current = await getMembershipSettings()
    const settings = await saveMembershipSettings({
      ...current,
      certificate: { ...current.certificate, imageUrl },
    })

    return NextResponse.json({ imageUrl, settings })
  } catch (error: any) {
    console.error("Certificate upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload certificate" },
      { status: 500 }
    )
  }
}
