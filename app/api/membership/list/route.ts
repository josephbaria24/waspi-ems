import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
    try {
        // Get all members with their profile data
        const { data, error } = await supabaseServer
            .from("members")
            .select(`
                *,
                profiles:profile_id (
                    full_name,
                    phone_number,
                    company,
                    position
                )
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const memberIds = (data || []).map((member: any) => member.id);
        const { data: documents } = memberIds.length
            ? await supabaseServer
                .from("member_documents")
                .select("member_id, file_url, uploaded_at")
                .eq("document_type", "receipt")
                .in("member_id", memberIds)
            : { data: [] };

        const receiptsByMember = new Map<string, { url: string; uploadedAt: string | null }[]>();
        for (const doc of documents || []) {
            const list = receiptsByMember.get(doc.member_id) || [];
            list.push({ url: doc.file_url, uploadedAt: doc.uploaded_at });
            receiptsByMember.set(doc.member_id, list);
        }

        // Get emails from auth (profiles don't store email)
        const membersList = await Promise.all(
            (data || []).map(async (member: any) => {
                const { data: authUser } = await supabaseServer.auth.admin.getUserById(member.profile_id);
                const storedReceipts = receiptsByMember.get(member.id) || [];
                const receipts = storedReceipts.length
                    ? storedReceipts
                    : member.receipt_url
                        ? [{ url: member.receipt_url, uploadedAt: member.receipt_uploaded_at }]
                        : [];
                return {
                    id: member.id,
                    trackingNumber: member.tracking_number,
                    membershipType: member.membership_type,
                    status: member.status,
                    paymentStatus: member.payment_status,
                    receiptUrl: member.receipt_url,
                    receipts,
                    receiptUploadedAt: member.receipt_uploaded_at,
                    reviewedAt: member.reviewed_at,
                    expiryDate: member.expiry_date,
                    createdAt: member.created_at,
                    paymentMethod: member.payment_method,
                    paymentDetails: member.payment_details || null,
                    profile: {
                        fullName: member.profiles?.full_name || "N/A",
                        email: authUser?.user?.email || "N/A",
                        phone: member.profiles?.phone_number || "",
                        company: member.profiles?.company || "",
                        position: member.profiles?.position || "",
                    },
                };
            })
        );

        return NextResponse.json({ members: membersList });
    } catch (error: any) {
        console.error("Admin list error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch members" },
            { status: 500 }
        );
    }
}
