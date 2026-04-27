import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { memberId, action } = body;

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

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
            reviewed_at: new Date().toISOString(),
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

        return NextResponse.json({
            message: `Membership ${action === "approve" ? "approved" : "declined"} successfully`,
            member: data,
        });
    } catch (error: any) {
        console.error("Review error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to review membership" },
            { status: 500 }
        );
    }
}
