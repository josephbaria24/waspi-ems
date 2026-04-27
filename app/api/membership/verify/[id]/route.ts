import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const id = params.id;

    try {
        // Find member by tracking number
        const { data: member, error: memberError } = await supabaseAdmin
            .from("members")
            .select(`
                id,
                tracking_number,
                membership_type,
                status,
                expiry_date,
                profiles (
                    full_name
                )
            `)
            .eq("tracking_number", id)
            .single();

        if (memberError || !member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Only verified/active members should show positive verification
        if (member.status !== "Active") {
            return NextResponse.json({
                verified: false,
                status: member.status,
                name: (member.profiles as any)?.full_name
            });
        }

        return NextResponse.json({
            verified: true,
            trackingNumber: member.tracking_number,
            membershipType: member.membership_type,
            name: (member.profiles as any)?.full_name,
            expiryDate: member.expiry_date
        });

    } catch (error: any) {
        console.error("Verification API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
