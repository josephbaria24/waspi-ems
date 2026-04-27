import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Sign in the user
        const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const userId = authData.user.id;

        // Get profile
        const { data: profile, error: profileError } = await supabaseServer
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (profileError) throw profileError;

        // Get membership
        const { data: member, error: memberError } = await supabaseServer
            .from("members")
            .select("*")
            .eq("profile_id", userId)
            .single();

        if (memberError) {
            return NextResponse.json(
                { error: "No membership record found. Please register first." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            profile: {
                fullName: profile.full_name,
                email: authData.user.email,
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
                receiptUploadedAt: member.receipt_uploaded_at,
                expiryDate: member.expiry_date,
                createdAt: member.created_at,
            },
        });
    } catch (error: any) {
        console.error("Membership status error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch membership status" },
            { status: 500 }
        );
    }
}
