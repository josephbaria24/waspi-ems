import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { sendMembershipReviewEmail } from "@/lib/send-membership-review-email";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { memberId, action, reason, amountReceived } = body;

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

        const amountDue = Number(member.payment_details?.amount_due ?? member.payment_details?.membership_amount ?? 0);
        const paymentNow = Number(amountReceived);
        const alreadyCollected = Number(member.payment_details?.amount_received || 0);
        const previousCollections = Array.isArray(member.payment_details?.collections)
            ? member.payment_details.collections
            : alreadyCollected > 0
                ? [{ amount: alreadyCollected, collectedAt: member.payment_details?.collected_at || new Date().toISOString() }]
                : [];

        if (action === "approve" && (!Number.isFinite(paymentNow) || paymentNow <= 0)) {
            return NextResponse.json(
                { error: "Enter the amount collected before accepting." },
                { status: 400 }
            );
        }

        const totalCollected = action === "approve" ? alreadyCollected + paymentNow : alreadyCollected;
        const paymentStatus = action !== "approve"
            ? "Declined"
            : totalCollected + 0.009 >= amountDue
                ? "Paid"
                : totalCollected > 0
                    ? "Partially Paid"
                    : "Unpaid";

        const collections = action === "approve"
            ? [...previousCollections, { amount: paymentNow, collectedAt: new Date().toISOString() }]
            : previousCollections;

        const paymentDetails = {
            ...(member.payment_details || {}),
            decline_reason: action === "decline" ? String(reason).trim() : null,
            ...(action === "approve"
                ? {
                    amount_received: totalCollected,
                    amount_due: amountDue,
                    paid_in_full: paymentStatus === "Paid",
                    collections,
                }
                : {}),
        };

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
            reviewed_at: new Date().toISOString(),
            payment_details: paymentDetails,
        };

        if (action === "approve") {
            updateData.status = paymentStatus === "Paid" ? "Active" : "Pending";
            updateData.payment_status = paymentStatus;
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

        if (email && (action === "decline" || paymentStatus === "Paid")) {
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
            message: action === "approve"
                ? paymentStatus === "Paid"
                    ? "Accepted and marked as paid"
                    : `Accepted, but not fully paid (${paymentStatus})`
                : "Membership declined successfully",
            member: data,
            paymentStatus,
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
