"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    CheckCircle2, XCircle, ShieldCheck,
    Calendar, User, CreditCard, Loader2, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function VerifyMembershipPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVerification() {
            try {
                const res = await fetch(`/api/membership/verify/${id}`);
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || "Verification failed");
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchVerification();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#017C7C] flex flex-col items-center justify-center p-4">
                <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
                <p className="text-white font-medium animate-pulse">Verifying Membership...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#017C7C] flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md border-2 border-white/20 shadow-2xl overflow-hidden">
                    <div className="bg-red-500 p-8 flex justify-center">
                        <XCircle className="h-20 w-20 text-white" />
                    </div>
                    <CardContent className="p-8 text-center space-y-4">
                        <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
                        <p className="text-gray-500">
                            {error || "We could not find a matching membership record for this tracking number."}
                        </p>
                        <Button asChild className="w-full bg-[#017C7C] hover:bg-[#016c6c]">
                            <Link href="/">Return to Website</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isVerified = data.verified;

    return (
        <div className="min-h-screen bg-[#017C7C] bg-gradient-to-br from-[#017C7C] via-[#018c8c] to-[#016c6c] flex flex-col items-center justify-center p-4">
            {/* WASPI Branding */}
            <div className="mb-8 text-center text-white">
                <ShieldCheck className="h-12 w-12 mx-auto mb-2 opacity-90" />
                <h2 className="text-xl font-bold tracking-widest uppercase">WASPI Official Verification</h2>
                <p className="text-white/60 text-xs italic">Women in Architecture, Science and Project Initiatives</p>
            </div>

            <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
                <div className={`${isVerified ? 'bg-green-500' : 'bg-amber-500'} p-8 flex flex-col items-center justify-center relative`}>
                    {isVerified ? (
                        <CheckCircle2 className="h-20 w-20 text-white" />
                    ) : (
                        <XCircle className="h-20 w-20 text-white" />
                    )}
                    <h1 className="text-2xl font-black text-white mt-4 uppercase tracking-tight">
                        {isVerified ? "Verified Member" : "Membership Inactive"}
                    </h1>
                </div>

                <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                        {/* Member Name */}
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Member Full Name</p>
                                <p className="text-lg font-bold text-gray-900">{data.name}</p>
                            </div>
                        </div>

                        {/* ID Number */}
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tracking Number</p>
                                <p className="text-lg font-mono font-bold text-primary">{data.trackingNumber || id}</p>
                            </div>
                        </div>

                        {/* Type */}
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Membership Type</p>
                                <p className="text-lg font-bold text-gray-900 capitalize">{data.membershipType || "—"}</p>
                            </div>
                        </div>

                        {/* Expiry */}
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Validity Period</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {data.expiryDate ? `Expires on ${new Date(data.expiryDate).toLocaleDateString()}` : "Not Active"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button asChild className="w-full h-12 bg-[#017C7C] hover:bg-[#016c6c] text-white font-bold group">
                            <Link href="/">
                                Visit Official Website
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
                            This is an official membership verification page for WASPI.
                            For concerns, contact verified@waspi.ph
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8 text-white/40 text-[10px] flex items-center gap-2">
                <span>SECURED BY WASPI-ID™</span>
                <span>•</span>
                <span>TRUSTED VERIFICATION</span>
            </div>
        </div>
    );
}
