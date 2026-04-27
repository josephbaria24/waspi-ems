import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { uploadToFTP } from "@/lib/ftp-upload";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = (formData.get("file") || formData.get("receipt")) as File | null;
        const trackingNumber = formData.get("trackingNumber") as string | null;
        const memberId = formData.get("memberId") as string | null;

        if (!file) {
            return NextResponse.json(
                { error: "Receipt file is required" },
                { status: 400 }
            );
        }

        if (!trackingNumber && !memberId) {
            return NextResponse.json(
                { error: "Tracking number or member ID is required" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Please upload a JPG, PNG, WebP, or PDF file." },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB." },
                { status: 400 }
            );
        }

        // Look up member by tracking number or memberId
        let memberQuery = supabaseServer
            .from("members")
            .select("id, tracking_number, status");

        if (trackingNumber) {
            memberQuery = memberQuery.eq("tracking_number", trackingNumber.trim());
        } else {
            memberQuery = memberQuery.eq("id", memberId!);
        }

        const { data: member, error: memberError } = await memberQuery.single();

        if (memberError || !member) {
            return NextResponse.json(
                { error: "Invalid tracking number or member ID. Please check and try again." },
                { status: 404 }
            );
        }

        // Create a unique filename
        const ext = file.name.split(".").pop() || "jpg";
        const timestamp = Date.now();
        const identifier = trackingNumber?.trim() || memberId;
        const fileName = `receipt_${identifier}_${timestamp}.${ext}`;

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to FTP
        const publicUrl = await uploadToFTP(buffer, fileName, "receipts");

        // Update member record in Supabase
        const { error: updateError } = await supabaseServer
            .from("members")
            .update({
                receipt_url: publicUrl,
                receipt_uploaded_at: new Date().toISOString(),
                payment_status: "Under Review",
                updated_at: new Date().toISOString(),
            })
            .eq("id", member.id);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: "Receipt uploaded successfully",
            receiptUrl: publicUrl,
        });
    } catch (error: any) {
        console.error("Receipt upload error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload receipt" },
            { status: 500 }
        );
    }
}
