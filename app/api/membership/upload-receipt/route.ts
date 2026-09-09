import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { uploadToFTP } from "@/lib/ftp-upload";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = [
            ...formData.getAll("file"),
            ...formData.getAll("receipt"),
        ].filter((item): item is File => item instanceof File && item.size > 0);
        const trackingNumber = formData.get("trackingNumber") as string | null;
        const memberId = formData.get("memberId") as string | null;

        if (files.length === 0) {
            return NextResponse.json(
                { error: "At least one receipt file is required" },
                { status: 400 }
            );
        }

        if (!trackingNumber && !memberId) {
            return NextResponse.json(
                { error: "Tracking number or member ID is required" },
                { status: 400 }
            );
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: "Invalid file type. Please upload JPG, PNG, WebP, or PDF files." },
                    { status: 400 }
                );
            }
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json(
                    { error: "Each file must be 10MB or smaller." },
                    { status: 400 }
                );
            }
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

        const uploadedAt = new Date().toISOString();
        const receipts: { url: string; uploadedAt: string }[] = [];
        const identifier = trackingNumber?.trim() || member.id;

        for (const [index, file] of files.entries()) {
            const ext = file.name.split(".").pop() || "jpg";
            const fileName = `receipt_${identifier}_${Date.now()}_${index}.${ext}`;
            const buffer = Buffer.from(await file.arrayBuffer());
            const publicUrl = await uploadToFTP(buffer, fileName, "receipts");

            const { error: documentError } = await supabaseServer.from("member_documents").insert({
                member_id: member.id,
                document_type: "receipt",
                file_url: publicUrl,
            });
            if (documentError) throw documentError;

            receipts.push({ url: publicUrl, uploadedAt });
        }

        const latestUrl = receipts[receipts.length - 1]?.url;
        const { data: currentMember } = await supabaseServer
            .from("members")
            .select("payment_details, status")
            .eq("id", member.id)
            .single();

        const paymentDetails = { ...(currentMember?.payment_details || {}) };
        if (currentMember?.status === "Declined" || paymentDetails.decline_reason) {
            paymentDetails.decline_reason = null;
        }

        const { error: updateError } = await supabaseServer
            .from("members")
            .update({
                receipt_url: latestUrl,
                receipt_uploaded_at: uploadedAt,
                payment_status: "Under Review",
                status: "Pending",
                payment_details: paymentDetails,
                updated_at: uploadedAt,
            })
            .eq("id", member.id);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: receipts.length > 1 ? "Receipts uploaded successfully" : "Receipt uploaded successfully",
            receiptUrl: latestUrl,
            receipts,
        });
    } catch (error: any) {
        console.error("Receipt upload error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload receipt" },
            { status: 500 }
        );
    }
}
