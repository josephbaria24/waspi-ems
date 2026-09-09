"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2, XCircle, Clock, FileImage,
    Loader2, ArrowLeft, Eye, Search, Users, Settings2, PhilippinePeso
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MembershipSetup } from "@/components/membership-setup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

type MemberItem = {
    id: string;
    trackingNumber: string;
    membershipType: string;
    status: string;
    paymentStatus: string;
    receiptUrl: string | null;
    receipts?: { url: string; uploadedAt: string | null }[];
    receiptUploadedAt: string | null;
    reviewedAt: string | null;
    expiryDate: string;
    createdAt: string;
    paymentMethod?: string;
    paymentDetails?: {
        membership_amount?: number;
        wants_physical_id?: boolean;
        physical_id_fee?: number;
        shipping_fee?: number;
        amount_due?: number;
        amount_received?: number;
        collections?: { amount: number; collectedAt: string }[];
        decline_reason?: string | null;
        delivery?: {
            recipient?: string;
            address?: string;
            city?: string;
            province?: string;
            zip?: string;
        } | null;
    } | null;
    profile: {
        fullName: string;
        email: string;
        phone: string;
        company: string;
        position: string;
    };
};

function memberAmount(member: MemberItem) {
    const due = Number(member.paymentDetails?.amount_due);
    if (Number.isFinite(due) && due > 0) return due;
    const membership = Number(member.paymentDetails?.membership_amount);
    if (Number.isFinite(membership) && membership > 0) return membership;
    return 0;
}

function dayKey(value?: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

function formatPeso(amount: number) {
    return `₱${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function collectedAmount(member: MemberItem) {
    const received = Number(member.paymentDetails?.amount_received);
    if (member.paymentStatus === "Paid") return Number.isFinite(received) && received > 0 ? received : memberAmount(member);
    if (member.paymentStatus === "Partially Paid" && Number.isFinite(received)) return received;
    return 0;
}

function summarizeMoney(members: MemberItem[]) {
    const collected = members.reduce((sum, member) => sum + collectedAmount(member), 0);
    const pending = members
        .filter((member) => member.status === "Pending" || member.paymentStatus === "Partially Paid" || member.paymentStatus === "Unpaid")
        .reduce((sum, member) => sum + Math.max(0, memberAmount(member) - collectedAmount(member)), 0);
    const expected = members
        .filter((member) => member.status !== "Declined")
        .reduce((sum, member) => sum + memberAmount(member), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const series = Array.from({ length: 14 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (13 - index));
        const key = dayKey(date.toISOString());
        const dayMembers = members.filter((member) => dayKey(member.createdAt) === key);
        return {
            label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            collected: dayMembers.reduce((sum, member) => sum + collectedAmount(member), 0),
            pending: dayMembers
                .filter((member) => member.status === "Pending" || member.paymentStatus === "Partially Paid" || member.paymentStatus === "Unpaid")
                .reduce((sum, member) => sum + Math.max(0, memberAmount(member) - collectedAmount(member)), 0),
        };
    });

    return { collected, pending, expected, series };
}

export default function MembershipAdminPage() {
    const router = useRouter();
    const [members, setMembers] = useState<MemberItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "Pending" | "Active" | "Declined">("all");
    const [showSetup, setShowSetup] = useState(false);
    const [declineReason, setDeclineReason] = useState("");
    const [showDeclineForm, setShowDeclineForm] = useState(false);
    const [amountReceived, setAmountReceived] = useState("");

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/membership/list");
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setMembers(data.members || []);
        } catch (error: any) {
            toast.error("Failed to load members", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Unauthorized", { description: "Please login to access the admin dashboard." });
                router.replace("/login?redirect=/membership/admin");
            } else {
                setIsCheckingAuth(false);
                fetchMembers();
            }
        };
        checkAuth();
    }, [router]);

    const handleReview = async (memberId: string, action: "approve" | "decline", reason?: string, receivedAmount?: number) => {
        if (action === "decline" && !reason?.trim()) {
            setShowDeclineForm(true);
            toast.error("Add a reason", { description: "The member will see this reason and can upload a new receipt." });
            return;
        }

        if (action === "approve" && (receivedAmount == null || Number.isNaN(receivedAmount) || receivedAmount < 0)) {
            toast.error("Enter the amount collected", { description: "Compare it with the amount due to mark the member as paid." });
            return;
        }

        setReviewingId(memberId);
        try {
            const response = await fetch("/api/membership/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, action, reason, amountReceived: receivedAmount }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            const nextStatus = data.member?.status || (action === "approve" ? "Active" : "Declined");
            const nextPayment = data.paymentStatus || (action === "approve" ? "Paid" : "Declined");
            toast.success(data.message || `Membership ${action === "approve" ? "approved" : "declined"}`);

            const nextDetails = data.member?.payment_details || {
                decline_reason: action === "decline" ? reason : null,
            };

            setMembers(prev =>
                prev.map(m => {
                    if (m.id === memberId) {
                        return {
                            ...m,
                            status: nextStatus,
                            paymentStatus: nextPayment,
                            reviewedAt: new Date().toISOString(),
                            paymentDetails: {
                                ...m.paymentDetails,
                                ...nextDetails,
                            },
                        };
                    }
                    return m;
                })
            );

            if (selectedMember?.id === memberId) {
                setSelectedMember(prev => prev ? {
                    ...prev,
                    status: nextStatus,
                    paymentStatus: nextPayment,
                    reviewedAt: new Date().toISOString(),
                    paymentDetails: {
                        ...prev.paymentDetails,
                        ...nextDetails,
                    },
                } : null);
            }
            setShowDeclineForm(false);
            setDeclineReason("");
            setAmountReceived("");
        } catch (error: any) {
            toast.error("Review failed", { description: error.message });
        } finally {
            setReviewingId(null);
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesFilter = filter === "all" || m.status === filter;
        const matchesSearch = !searchQuery ||
            m.profile.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Active":
                return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20"><CheckCircle2 className="h-3 w-3" />Active</span>;
            case "Declined":
                return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20"><XCircle className="h-3 w-3" />Declined</span>;
            default:
                return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20"><Clock className="h-3 w-3" />Pending</span>;
        }
    };

    const stats = {
        total: members.length,
        pending: members.filter(m => m.status === "Pending").length,
        active: members.filter(m => m.status === "Active").length,
        declined: members.filter(m => m.status === "Declined").length,
    };

    const money = summarizeMoney(members);

    if (isCheckingAuth) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F7FBF8]">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#E8EAEB] border-b-[#00D47E]" />
                <p className="text-sm text-[#8D959D]">Verifying authorization...</p>
            </div>
        );
    }

    // ==================== MEMBER DETAIL VIEW ====================
    if (selectedMember) {
        return (
            <main className="min-h-screen bg-[#F7FBF8]">
                <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
                    <div className="relative overflow-hidden rounded-3xl bg-[#0B1F14] px-5 py-5 text-white sm:px-6">
                        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-32 rounded-full bg-[#00D47E]/25" />
                        <div className="relative flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setSelectedMember(null)}
                                className="h-10 w-10 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <p className="text-xs text-white/60">Membership application</p>
                                <h1 className="text-xl font-semibold">{selectedMember.profile.fullName}</h1>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Member Info */}
                        <Card className="rounded-2xl border border-[#E8EAEB] bg-white shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-[#1E1E1E]">Member Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name</span>
                                        <span className="font-medium">{selectedMember.profile.fullName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email</span>
                                        <span className="font-medium">{selectedMember.profile.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Phone</span>
                                        <span className="font-medium">{selectedMember.profile.phone || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Company</span>
                                        <span className="font-medium">{selectedMember.profile.company || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Position</span>
                                        <span className="font-medium">{selectedMember.profile.position || "—"}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between">
                                        <span className="text-muted-foreground">Tracking #</span>
                                        <span className="font-mono font-bold text-primary">{selectedMember.trackingNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-medium capitalize">{selectedMember.membershipType}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Status</span>
                                        {getStatusBadge(selectedMember.status)}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Registered</span>
                                        <span className="font-medium">{new Date(selectedMember.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {selectedMember.paymentDetails?.amount_due != null && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Amount due</span>
                                            <span className="font-medium">₱{Number(selectedMember.paymentDetails.amount_due).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Amount collected</span>
                                        <span className="font-medium">₱{Number(selectedMember.paymentDetails?.amount_received || 0).toFixed(2)}</span>
                                    </div>
                                    {selectedMember.paymentDetails?.amount_due != null && (() => {
                                        const due = Number(selectedMember.paymentDetails.amount_due)
                                        const saved = Number(selectedMember.paymentDetails?.amount_received || 0)
                                        const typed = amountReceived === "" ? 0 : Number(amountReceived)
                                        const remaining = Math.max(0, due - saved - typed)
                                        return (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Remaining balance</span>
                                                <span className={`font-semibold ${remaining === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                                                    ₱{remaining.toFixed(2)}
                                                </span>
                                            </div>
                                        )
                                    })()}
                                    {(selectedMember.paymentDetails?.collections?.length || Number(selectedMember.paymentDetails?.amount_received || 0) > 0) && (
                                        <details className="rounded-xl border border-[#E8EAEB] bg-[#F7FBF8] px-3 py-2">
                                            <summary className="cursor-pointer text-sm font-semibold text-[#0B1F14]">
                                                Collection history ({selectedMember.paymentDetails?.collections?.length || 1})
                                            </summary>
                                            <div className="mt-2 space-y-2">
                                                {(selectedMember.paymentDetails?.collections?.length
                                                    ? selectedMember.paymentDetails.collections
                                                    : [{ amount: Number(selectedMember.paymentDetails?.amount_received || 0), collectedAt: selectedMember.reviewedAt || selectedMember.createdAt }]
                                                ).map((entry, index) => (
                                                    <div key={`${entry.collectedAt}-${index}`} className="flex items-center justify-between text-sm">
                                                        <span className="text-[#8D959D]">
                                                            {new Date(entry.collectedAt).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                                        </span>
                                                        <span className="font-semibold text-[#0B1F14]">₱{Number(entry.amount).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    )}
                                    {selectedMember.paymentStatus && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Payment</span>
                                            <span className="font-medium">{selectedMember.paymentStatus}</span>
                                        </div>
                                    )}
                                    {selectedMember.paymentDetails?.wants_physical_id && (
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Delivery</span>
                                            <span className="font-medium text-right">
                                                {[
                                                    selectedMember.paymentDetails.delivery?.recipient,
                                                    selectedMember.paymentDetails.delivery?.address,
                                                    selectedMember.paymentDetails.delivery?.city,
                                                    selectedMember.paymentDetails.delivery?.province,
                                                    selectedMember.paymentDetails.delivery?.zip,
                                                ].filter(Boolean).join(", ") || "Physical ID requested"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                {selectedMember.status === "Pending" && selectedMember.receiptUrl && (
                                    <div className="space-y-3 pt-4 border-t">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Amount collected</label>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#017C7C]">₱</span>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={amountReceived}
                                                    onChange={(e) => {
                                                        const raw = e.target.value
                                                        if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return
                                                        setAmountReceived(raw)
                                                    }}
                                                    placeholder={selectedMember.paymentDetails?.amount_due != null ? Number(selectedMember.paymentDetails.amount_due).toFixed(2) : "0.00"}
                                                    className="h-11 rounded-xl border-[#E8EAEB] pl-8"
                                                />
                                            </div>
                                            <p className="text-xs text-[#8D959D]">
                                                This amount is added to what was already collected. When the total reaches the amount due, the member is marked fully paid.
                                            </p>
                                        </div>
                                        {showDeclineForm && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-red-600">Reason for declining</p>
                                                <Textarea
                                                    value={declineReason}
                                                    onChange={(e) => setDeclineReason(e.target.value)}
                                                    placeholder="Explain what the member should fix before uploading again."
                                                    rows={3}
                                                />
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleReview(selectedMember.id, "approve", undefined, amountReceived === "" ? undefined : Number(amountReceived))}
                                            disabled={reviewingId === selectedMember.id || amountReceived === ""}
                                            className="h-11 flex-1 rounded-full bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]"
                                        >
                                            {reviewingId === selectedMember.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <><CheckCircle2 className="h-4 w-4 mr-1" />Approve</>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => handleReview(selectedMember.id, "decline", declineReason)}
                                            disabled={reviewingId === selectedMember.id}
                                            variant="outline"
                                            className="h-11 flex-1 rounded-full border-red-200 text-red-600 hover:bg-red-50"
                                        >
                                            {reviewingId === selectedMember.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <><XCircle className="h-4 w-4 mr-1" />{showDeclineForm ? "Send decline" : "Decline"}</>
                                            )}
                                        </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Receipt Preview */}
                        <Card className="rounded-2xl border border-[#E8EAEB] bg-white shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg text-[#1E1E1E]">
                                    <FileImage className="h-5 w-5 text-[#017C7C]" />
                                    Receipts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(selectedMember.receipts?.length || selectedMember.receiptUrl) ? (
                                    <div className="space-y-4">
                                        {(selectedMember.receipts?.length
                                            ? selectedMember.receipts
                                            : [{ url: selectedMember.receiptUrl!, uploadedAt: selectedMember.receiptUploadedAt }]
                                        ).map((receipt, index) => (
                                            <div key={`${receipt.url}-${index}`} className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground">Receipt {index + 1}</p>
                                                <div className="border rounded-lg overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={receipt.url}
                                                        alt={`Payment Receipt ${index + 1}`}
                                                        className="w-full max-h-[420px] object-contain bg-muted/30"
                                                    />
                                                </div>
                                                <a
                                                    href={receipt.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View full file
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
                                        <FileImage className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No receipt uploaded yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        );
    }

    // ==================== MEMBERS LIST ====================
    const statCards = [
        { label: "Total", value: stats.total, hint: "Applications", icon: Users, tint: "bg-emerald-50 text-emerald-700" },
        { label: "Pending", value: stats.pending, hint: "Awaiting review", icon: Clock, tint: "bg-amber-50 text-amber-700" },
        { label: "Active", value: stats.active, hint: "Approved members", icon: CheckCircle2, tint: "bg-[#00D47E]/15 text-[#0B1F14]" },
        { label: "Declined", value: stats.declined, hint: "Needs reupload", icon: XCircle, tint: "bg-red-50 text-red-600" },
    ]

    return (
        <main className="min-h-screen bg-[#F7FBF8]">
            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
                {showSetup ? (
                    <MembershipSetup onBack={() => setShowSetup(false)} />
                ) : (
                <>
                <div className="relative overflow-hidden rounded-3xl bg-[#0B1F14] px-5 py-6 text-white sm:px-7">
                    <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#00D47E]/25" />
                    <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-40 rounded-full bg-[#017C7C]/40" />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00D47E] text-[#0B1F14]">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold sm:text-3xl">Membership Applications</h1>
                                <p className="mt-1 text-sm text-white/70">Review and manage membership registrations</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setShowSetup(true)}
                                className="h-10 rounded-full bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]"
                            >
                                <Settings2 className="h-4 w-4" />
                                Setup
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => { window.location.href = "/events" }}
                                className="h-10 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {statCards.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <div key={stat.label} className="rounded-2xl border border-[#E8EAEB] bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#8D959D]">{stat.label}</p>
                                        <p className="mt-1 text-2xl font-semibold text-[#1E1E1E] sm:text-3xl">{stat.value}</p>
                                    </div>
                                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tint}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="mt-3 text-xs text-[#8D959D]">{stat.hint}</p>
                            </div>
                        )
                    })}
                </div>

                <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
                    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#E8EAEB] bg-white p-3 shadow-sm">
                        {[
                            { label: "Collected", value: money.collected, hint: "Approved", tone: "text-emerald-700" },
                            { label: "Pending", value: money.pending, hint: "Awaiting", tone: "text-amber-700" },
                            { label: "Expected", value: money.expected, hint: "All fees", tone: "text-[#017C7C]" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl bg-[#F7FBF8] px-2.5 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8D959D]">{item.label}</p>
                                <p className={`mt-1 text-sm font-semibold sm:text-base ${item.tone}`}>{formatPeso(item.value)}</p>
                                <p className="mt-1 text-[10px] text-[#8D959D]">{item.hint}</p>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-2xl border border-[#E8EAEB] bg-white p-3 shadow-sm">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                                <PhilippinePeso className="h-3.5 w-3.5 text-[#017C7C]" />
                                Collections, last 14 days
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-[#8D959D]">
                                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-[#00D47E]" />Collected</span>
                                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-[#F5B942]" />Pending</span>
                            </div>
                        </div>
                        <div className="h-28">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={money.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid stroke="#E8EAEB" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8D959D" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                    <YAxis hide />
                                    <Tooltip
                                        formatter={(value, name) => [formatPeso(Number(value || 0)), name === "collected" ? "Collected" : "Pending"]}
                                        contentStyle={{ borderRadius: 12, borderColor: "#E8EAEB", fontSize: 12 }}
                                    />
                                    <Line type="monotone" dataKey="collected" stroke="#00D47E" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="pending" stroke="#F5B942" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D959D]" />
                        <Input
                            placeholder="Search by name, email, or tracking number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 rounded-full border-[#E8EAEB] bg-white pl-9 shadow-none focus-visible:border-[#00D47E] focus-visible:ring-[#00D47E]/20"
                        />
                    </div>
                    <div className="flex gap-1 rounded-full border border-[#E8EAEB] bg-white p-1">
                        {(["all", "Pending", "Active", "Declined"] as const).map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => setFilter(f)}
                                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                                    filter === f
                                        ? "bg-[#00D47E] text-[#0B1F14]"
                                        : "text-[#8D959D] hover:text-[#0B1F14]"
                                }`}
                            >
                                {f === "all" ? "All" : f}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E8EAEB] border-b-[#00D47E]" />
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#CDEEDD] bg-white px-6 py-16 text-center">
                        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00D47E]/15 text-[#0B1F14]">
                            <Users className="h-7 w-7" />
                        </span>
                        <p className="text-lg font-semibold text-[#1E1E1E]">No membership applications found</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-[#E8EAEB] bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-[#E8EAEB] bg-[#F7FBF8]">
                                    <tr>
                                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Name</th>
                                        <th className="hidden p-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8D959D] md:table-cell">Email</th>
                                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Tracking #</th>
                                        <th className="hidden p-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8D959D] sm:table-cell">Type</th>
                                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Status</th>
                                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Receipt</th>
                                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E8EAEB]">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="transition-colors hover:bg-[#F7FBF8]">
                                            <td className="p-3 font-medium text-[#1E1E1E]">{member.profile.fullName}</td>
                                            <td className="hidden p-3 text-[#8D959D] md:table-cell">{member.profile.email}</td>
                                            <td className="p-3 font-mono text-xs font-semibold text-[#017C7C]">{member.trackingNumber || "—"}</td>
                                            <td className="hidden p-3 capitalize text-[#1E1E1E] sm:table-cell">{member.membershipType}</td>
                                            <td className="p-3">{getStatusBadge(member.status)}</td>
                                            <td className="p-3">
                                                {(member.receipts?.length || member.receiptUrl) ? (
                                                    <span className="text-xs font-semibold text-emerald-700">
                                                        {member.receipts?.length || 1} uploaded
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-[#8D959D]">None</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedMember(member)}
                                                        className="h-8 rounded-full px-2.5 text-xs text-[#0B1F14] hover:bg-[#00D47E]/15"
                                                    >
                                                        <Eye className="mr-1 h-3 w-3" />
                                                        View
                                                    </Button>
                                                    {member.status === "Pending" && member.receiptUrl && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedMember(member)
                                                                    setAmountReceived(member.paymentDetails?.amount_due != null ? String(member.paymentDetails.amount_due) : "")
                                                                }}
                                                                disabled={reviewingId === member.id}
                                                                className="h-8 rounded-full bg-[#00D47E] px-3 text-xs font-semibold text-[#0B1F14] hover:bg-[#00c174]"
                                                            >
                                                                {reviewingId === member.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedMember(member);
                                                                    setShowDeclineForm(true);
                                                                }}
                                                                disabled={reviewingId === member.id}
                                                                className="h-8 rounded-full border-red-200 px-3 text-xs text-red-600 hover:bg-red-50"
                                                            >
                                                                {reviewingId === member.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Decline"}
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                </>
                )}
            </div>
        </main>
    );
}
