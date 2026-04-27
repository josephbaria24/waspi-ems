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

        // Get emails from auth (profiles don't store email)
        const membersList = await Promise.all(
            (data || []).map(async (member: any) => {
                const { data: authUser } = await supabaseServer.auth.admin.getUserById(member.profile_id);
                return {
                    id: member.id,
                    trackingNumber: member.tracking_number,
                    membershipType: member.membership_type,
                    status: member.status,
                    paymentStatus: member.payment_status,
                    receiptUrl: member.receipt_url,
                    receiptUploadedAt: member.receipt_uploaded_at,
                    reviewedAt: member.reviewed_at,
                    expiryDate: member.expiry_date,
                    createdAt: member.created_at,
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
