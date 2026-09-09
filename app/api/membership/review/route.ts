import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { sendMembershipReviewEmail } from "@/lib/send-membership-review-email";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { memberId, action, reason } = body;

        if (!memberId || !action) {
            return NextResponse.json(
                { error: "Member ID and action are required" },
                { status: 400 }
            );
        }

        if (!["approve", "decline"].includes(action)) {
            return NextResponse.json(
                { error: "Action must be 'approve' or 'decline'" },
                { status: 400 }
            );
        }

        if (action === "decline" && !String(reason || "").trim()) {
            return NextResponse.json(
                { error: "A decline reason is required" },
                { status: 400 }
            );
        }

        const { data: member, error: memberError } = await supabaseServer
            .from("members")
            .select("id, profile_id, tracking_number, payment_details")
            .eq("id", memberId)
            .single();

        if (memberError || !member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        const paymentDetails = {
            ...(member.payment_details || {}),
            decline_reason: action === "decline" ? String(reason).trim() : null,
        };

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
            reviewed_at: new Date().toISOString(),
            payment_details: paymentDetails,
        };

        if (action === "approve") {
            updateData.status = "Active";
            updateData.payment_status = "Paid";
        } else {
            updateData.status = "Declined";
            updateData.payment_status = "Declined";
        }

        const { data, error } = await supabaseServer
            .from("members")
            .update(updateData)
            .eq("id", memberId)
            .select()
            .single();

        if (error) throw error;

        const { data: profile } = await supabaseServer
            .from("profiles")
            .select("full_name")
            .eq("id", member.profile_id)
            .maybeSingle();

        const { data: authUser } = await supabaseServer.auth.admin.getUserById(member.profile_id);
        const email = authUser?.user?.email;

        if (email) {
            try {
                await sendMembershipReviewEmail({
                    email,
                    fullName: profile?.full_name || "Member",
                    trackingNumber: member.tracking_number || "",
                    action,
                    reason: action === "decline" ? String(reason).trim() : undefined,
                });
            } catch (emailError) {
                console.error("Review email error:", emailError);
            }
        }

        return NextResponse.json({
            message: `Membership ${action === "approve" ? "approved" : "declined"} successfully`,
            member: data,
            declineReason: paymentDetails.decline_reason,
        });
    } catch (error: any) {
        console.error("Review error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to review membership" },
            { status: 500 }
        );
    }
}
