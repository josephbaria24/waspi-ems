"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2, XCircle, Clock, FileImage,
    Loader2, ArrowLeft, Eye, Search, Users, Settings2
} from "lucide-react";
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

    const handleReview = async (memberId: string, action: "approve" | "decline", reason?: string) => {
        if (action === "decline" && !reason?.trim()) {
            setShowDeclineForm(true);
            toast.error("Add a reason", { description: "The member will see this reason and can upload a new receipt." });
            return;
        }

        setReviewingId(memberId);
        try {
            const response = await fetch("/api/membership/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, action, reason }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            toast.success(`Membership ${action === "approve" ? "approved" : "declined"}`);

            // Update local state
            setMembers(prev =>
                prev.map(m => {
                    if (m.id === memberId) {
                        return {
                            ...m,
                            status: action === "approve" ? "Active" : "Declined",
                            paymentStatus: action === "approve" ? "Paid" : "Declined",
                            reviewedAt: new Date().toISOString(),
                            paymentDetails: {
                                ...m.paymentDetails,
                                decline_reason: action === "decline" ? reason : null,
                            },
                        };
                    }
                    return m;
                })
            );

            // Update selected member if viewing
            if (selectedMember?.id === memberId) {
                setSelectedMember(prev => prev ? {
                    ...prev,
                    status: action === "approve" ? "Active" : "Declined",
                    paymentStatus: action === "approve" ? "Paid" : "Declined",
                    reviewedAt: new Date().toISOString(),
                    paymentDetails: {
                        ...prev.paymentDetails,
                        decline_reason: action === "decline" ? reason : null,
                    },
                } : null);
            }
            setShowDeclineForm(false);
            setDeclineReason("");
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

    if (isCheckingAuth) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Verifying authorization...</p>
            </div>
        );
    }

    // ==================== MEMBER DETAIL VIEW ====================
    if (selectedMember) {
        return (
            <main className="min-h-screen bg-background">
                <div className="container mx-auto p-6 max-w-4xl space-y-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMember(null)}
                        className="gap-1"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to List
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Member Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Member Details</CardTitle>
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
                                            onClick={() => handleReview(selectedMember.id, "approve")}
                                            disabled={reviewingId === selectedMember.id}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
                                            className="flex-1 border-red-500/30 text-red-600 hover:bg-red-500/10"
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileImage className="h-5 w-5 text-primary" />
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
    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto p-6 max-w-6xl space-y-6">
                {showSetup ? (
                    <MembershipSetup onBack={() => setShowSetup(false)} />
                ) : (
                <>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Users className="h-6 w-6 text-primary" />
                            Membership Applications
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Review and manage membership registrations
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => setShowSetup(true)}
                            className="gap-1"
                        >
                            <Settings2 className="h-4 w-4" />
                            Setup
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = "/events"}
                            className="gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: "Total", value: stats.total, color: "text-foreground" },
                        { label: "Pending", value: stats.pending, color: "text-amber-500" },
                        { label: "Active", value: stats.active, color: "text-green-500" },
                        { label: "Declined", value: stats.declined, color: "text-red-500" },
                    ].map((stat) => (
                        <Card key={stat.label} className="border">
                            <CardContent className="p-4 text-center">
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filter & Search */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or tracking number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-1.5">
                        {(["all", "Pending", "Active", "Declined"] as const).map((f) => (
                            <Button
                                key={f}
                                variant={filter === f ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter(f)}
                                className={filter === f ? "bg-primary text-primary-foreground" : ""}
                            >
                                {f === "all" ? "All" : f}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Members Table */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">No membership applications found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                                        <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                                        <th className="text-left p-3 font-medium text-muted-foreground">Tracking #</th>
                                        <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                        <th className="text-left p-3 font-medium text-muted-foreground">Receipt</th>
                                        <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-medium">{member.profile.fullName}</td>
                                            <td className="p-3 text-muted-foreground hidden md:table-cell">{member.profile.email}</td>
                                            <td className="p-3 font-mono text-xs text-primary">{member.trackingNumber || "—"}</td>
                                            <td className="p-3 capitalize hidden sm:table-cell">{member.membershipType}</td>
                                            <td className="p-3">{getStatusBadge(member.status)}</td>
                                            <td className="p-3">
                                                {(member.receipts?.length || member.receiptUrl) ? (
                                                    <span className="text-green-600 text-xs font-medium">
                                                        ✓ {member.receipts?.length || 1} uploaded
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">None</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedMember(member)}
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View
                                                    </Button>
                                                    {member.status === "Pending" && member.receiptUrl && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleReview(member.id, "approve")}
                                                                disabled={reviewingId === member.id}
                                                                className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                {reviewingId === member.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "✓"}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedMember(member);
                                                                    setShowDeclineForm(true);
                                                                }}
                                                                disabled={reviewingId === member.id}
                                                                className="h-7 px-2 text-xs border-red-500/30 text-red-600"
                                                            >
                                                                {reviewingId === member.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "✗"}
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
                    </Card>
                )}
                </>
                )}
            </div>
        </main>
    );
}
