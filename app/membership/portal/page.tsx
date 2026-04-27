"use client";

import { useState, useRef } from "react";
import {
    LogIn, Upload, CheckCircle2, Clock, XCircle,
    FileImage, Loader2, Eye, EyeOff, ArrowLeft,
    Maximize2, Download, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MembershipCard3D } from "@/components/ui/membership-card-3d";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import html2canvas from "html2canvas";

type MembershipData = {
    profile: {
        fullName: string;
        email: string;
        phone: string;
        company: string;
        position: string;
    };
    membership: {
        id: string;
        trackingNumber: string;
        type: string;
        status: string;
        paymentStatus: string;
        receiptUrl: string | null;
        receiptUploadedAt: string | null;
        expiryDate: string;
        createdAt: string;
    };
};

export default function MemberPortalPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [data, setData] = useState<MembershipData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cardPrintRef = useRef<HTMLDivElement>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("/api/membership/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error("Login Failed", { description: result.error });
                return;
            }

            setData(result);
            setIsLoggedIn(true);
            toast.success("Welcome back!", { description: `Logged in as ${result.profile.fullName}` });
        } catch (error) {
            toast.error("Error", { description: "Failed to connect. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const downloadCard = async () => {
        if (!cardPrintRef.current) {
            toast.error("Download Error", { description: "Capture target not found." });
            return;
        }

        setIsDownloading(true);
        toast.loading("Generating card...", { id: "downloading" });

        try {
            // Small delay to ensure any dynamic content (like QR) is fully transitioned if needed
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(cardPrintRef.current, {
                scale: 3, // High quality
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                onclone: (clonedDoc) => {
                    // Force the card to be "flat" and visible for the capture
                    const cardInner = clonedDoc.querySelector('[data-card-inner="true"]');
                    if (cardInner) {
                        (cardInner as HTMLElement).style.transform = 'none';
                        (cardInner as HTMLElement).style.transition = 'none';
                    }

                    // Ensure the hidden container is visible for html2canvas
                    const container = clonedDoc.querySelector('[data-download-container="true"]');
                    if (container) {
                        (container as HTMLElement).style.position = 'relative';
                        (container as HTMLElement).style.left = '0';
                        (container as HTMLElement).style.opacity = '1';
                    }

                    // 🛡️ Fix: html2canvas "lab" color error
                    // Remove modern CSS features that html2canvas doesn't support
                    const styleTags = clonedDoc.getElementsByTagName('style');
                    for (let i = 0; i < styleTags.length; i++) {
                        const tag = styleTags[i];
                        if (tag.innerHTML.includes('lab(') || tag.innerHTML.includes('color-mix')) {
                            // Strip out @supports blocks that mention lab or oklab
                            tag.innerHTML = tag.innerHTML.replace(/@supports\s*\(color:\s*color-mix\s*\([^)]+\)\)\s*\{[^{}]*\{[^{}]*\}[^{}]*\}|@supports\s*\(color:\s*color-mix\s*\([^)]+\)\)\s*\{[^{}]*\}/g, '');
                        }
                    }
                }
            });

            const link = document.createElement("a");
            link.download = `WASPI_Membership_${data?.membership.trackingNumber || 'ID'}.png`;
            link.href = canvas.toDataURL("image/png");

            // Append to body for better mobile support
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Card Downloaded", { id: "downloading", description: "Your membership card has been saved." });
        } catch (error) {
            console.error("Download Error:", error);
            toast.error("Download Failed", { id: "downloading", description: "Could not generate card image. Please try again." });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Invalid file", { description: "Please upload JPG, PNG, WebP, or PDF." });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large", { description: "Max file size is 5MB." });
            return;
        }

        setPendingFile(file);

        // Create preview URL if it's an image
        if (file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null); // No preview for PDF
        }
    };

    const cancelSelection = () => {
        setPendingFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const confirmUpload = async () => {
        if (!pendingFile || !data) return;

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("receipt", pendingFile);
            formData.append("memberId", data.membership.id);

            const response = await fetch("/api/membership/upload-receipt", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error("Upload Failed", { description: result.error });
                return;
            }

            // Update local state
            setData(prev => prev ? {
                ...prev,
                membership: {
                    ...prev.membership,
                    receiptUrl: result.receiptUrl,
                    receiptUploadedAt: new Date().toISOString(),
                    paymentStatus: "Under Review",
                }
            } : null);

            toast.success("Receipt Uploaded!", { description: "Your receipt is now under review." });
            setPendingFile(null);
            setPreviewUrl(null);
        } catch (error) {
            toast.error("Error", { description: "Failed to upload receipt." });
        } finally {
            setIsUploading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "Active":
                return { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", label: "Active" };
            case "Declined":
                return { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", label: "Declined" };
            default:
                return { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Pending" };
        }
    };

    const getPaymentStatusConfig = (status: string) => {
        switch (status) {
            case "Paid":
                return { color: "text-green-600 bg-green-500/10 border-green-500/20", label: "Paid" };
            case "Under Review":
                return { color: "text-blue-600 bg-blue-500/10 border-blue-500/20", label: "Under Review" };
            case "Declined":
                return { color: "text-red-600 bg-red-500/10 border-red-500/20", label: "Declined" };
            default:
                return { color: "text-amber-600 bg-amber-500/10 border-amber-500/20", label: "Pending" };
        }
    };

    // ==================== LOGIN SCREEN ====================
    if (!isLoggedIn) {
        return (
            <main className="min-h-screen bg-[#017C7C] bg-gradient-to-br from-[#017C7C] via-[#018c8c] to-[#016c6c]">
                <div className="container relative z-10 mx-auto px-4 py-12 md:py-24 flex flex-col items-center">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-10 text-white">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                                Member Portal
                            </h1>
                            <p className="text-white/70">
                                Track your membership and upload payment receipt
                            </p>
                        </div>

                        <Card className="border-2 border-primary/20 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LogIn className="h-5 w-5" />
                                    Sign In
                                </CardTitle>
                                <CardDescription>
                                    Use your registration email and password
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Your password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                        {isLoading ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</>
                                        ) : (
                                            "Sign In"
                                        )}
                                    </Button>
                                </form>

                                <div className="mt-4 text-center">
                                    <a
                                        href="/membership/register"
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Don&apos;t have an account? Register here
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        );
    }

    // ==================== MEMBER DASHBOARD ====================
    const statusConfig = getStatusConfig(data!.membership.status);
    const StatusIcon = statusConfig.icon;
    const paymentConfig = getPaymentStatusConfig(data!.membership.paymentStatus);

    return (
        <main className="min-h-screen bg-[#017C7C] bg-gradient-to-br from-[#017C7C] via-[#018c8c] to-[#016c6c]">
            <div className="container relative z-10 mx-auto px-4 py-8 md:py-16">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="text-white">
                            <h1 className="text-2xl md:text-3xl font-bold">Welcome, {data!.profile.fullName}</h1>
                            <p className="text-white/70 text-sm">{data!.profile.email}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setIsLoggedIn(false); setData(null); }}
                            className="text-white bg-red-500/70  border-white/30 hover:bg-red-500"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Sign Out
                        </Button>
                    </div>

                    {/* Status Card & 3D Card Display */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Member Details */}
                        <Card className={`border-2 border-primary/20 shadow-lg ${data!.membership.status === 'Active' ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tracking Number</p>
                                                <p className="text-xl font-mono font-bold text-primary">{data!.membership.trackingNumber}</p>
                                            </div>
                                            {data!.membership.status === 'Active' && (
                                                <div className="bg-primary/10 text-primary p-2 rounded-full border border-primary/20">
                                                    <ShieldCheck className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registration Status</p>
                                                <div className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.border} border ${statusConfig.color}`}>
                                                    <StatusIcon className="h-3.5 w-3.5" />
                                                    {statusConfig.label}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Payment</p>
                                                <span className={`inline-flex items-center text-sm font-semibold px-2.5 py-1 rounded-full border ${paymentConfig.color}`}>
                                                    {paymentConfig.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Membership Type</p>
                                                <p className="font-medium capitalize text-foreground">{data!.membership.type}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                                    {data!.membership.status === 'Active' ? 'Expires On' : 'Registered On'}
                                                </p>
                                                <p className="font-medium text-foreground">
                                                    {new Date(data!.membership.status === 'Active' ? data!.membership.expiryDate : data!.membership.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3D Membership Card (Only when Active) */}
                        {data!.membership.status === 'Active' && (
                            <Card className="lg:col-span-5 border-2 border-primary/20 shadow-lg overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-primary/10">
                                <div className="space-y-4 w-full">
                                    <div className="text-center mb-2">
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Your Digital ID</p>
                                        <p className="text-[10px] text-muted-foreground italic">Click to flip the card</p>
                                    </div>

                                    <div className="relative group">
                                        <MembershipCard3D
                                            variant="display"
                                            type={data!.membership.type as any}
                                            name={data!.profile.fullName}
                                            trackingNumber={data!.membership.trackingNumber}
                                            expiryDate={data!.membership.expiryDate}
                                        />
                                    </div>

                                    <div className="flex gap-2 w-full pt-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="flex-1 bg-white/50 backdrop-blur-sm">
                                                    <Maximize2 className="h-4 w-4 mr-2" />
                                                    Full Screen
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-[480px] p-12 bg-transparent border-none shadow-none flex flex-col items-center justify-center">
                                                <DialogHeader className="sr-only">
                                                    <DialogTitle>Membership Card Full Screen</DialogTitle>
                                                    <DialogDescription>
                                                        Interactive 3D membership card for {data!.profile.fullName}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="w-full">
                                                    <MembershipCard3D
                                                        variant="display"
                                                        type={data!.membership.type as any}
                                                        name={data!.profile.fullName}
                                                        trackingNumber={data!.membership.trackingNumber}
                                                        expiryDate={data!.membership.expiryDate}
                                                    />
                                                </div>
                                                <div className="mt-8 flex gap-4">
                                                    <Button
                                                        onClick={downloadCard}
                                                        disabled={isDownloading}
                                                        className="bg-primary hover:bg-primary/90"
                                                    >
                                                        {isDownloading ? (
                                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> saving...</>
                                                        ) : (
                                                            <><Download className="h-4 w-4 mr-2" /> Download Card</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-white/50 backdrop-blur-sm"
                                            onClick={downloadCard}
                                            disabled={isDownloading}
                                        >
                                            {isDownloading ? (
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />...</>
                                            ) : (
                                                <><Download className="h-4 w-4 mr-2" /> Download</>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Hidden print container to capture the card with accurate styles */}
                                <div className="fixed -left-[2000px] top-0 pointer-events-none" data-download-container="true">
                                    <div ref={cardPrintRef} style={{ width: '600px', height: '380px' }} className="p-8 bg-[#017C7C] rounded-2xl">
                                        <MembershipCard3D
                                            variant="display"
                                            type={data!.membership.type as any}
                                            name={data!.profile.fullName}
                                            trackingNumber={data!.membership.trackingNumber}
                                            expiryDate={data!.membership.expiryDate}
                                        />
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Receipt Upload Card */}
                    <Card className="border-2 border-primary/20 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileImage className="h-5 w-5 text-primary" />
                                Payment Receipt
                            </CardTitle>
                            <CardDescription>
                                Upload your payment receipt for admin review
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data!.membership.receiptUrl && !pendingFile ? (
                                <div className="space-y-3">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                                Receipt uploaded successfully
                                            </p>
                                            <p className="text-xs text-green-600/70 dark:text-green-500/70 mt-1">
                                                Uploaded on {new Date(data!.membership.receiptUploadedAt!).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="border rounded-lg overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={data!.membership.receiptUrl}
                                            alt="Payment Receipt"
                                            className="w-full max-h-96 object-contain bg-muted/30"
                                        />
                                    </div>

                                    {/* Action Buttons for already uploaded receipt */}
                                    <div className="flex flex-col gap-3">
                                        {data!.membership.paymentStatus === "Declined" ? (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                                                    Your receipt was declined. Please upload a new one.
                                                </p>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                                <Button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    variant="outline"
                                                    className="w-full border-red-500/30 text-red-600 hover:bg-red-500/10"
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />Re-upload Receipt
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="pt-2">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                                <Button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    variant="ghost"
                                                    className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5 border border-dashed border-muted-foreground/20"
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />Upload Another Receipt
                                                </Button>
                                                <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
                                                    Note: Uploading another will replace your current receipt.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : pendingFile ? (
                                <div className="space-y-4">
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
                                        <p className="text-sm font-medium text-amber-700">Confirm Receipt Upload</p>
                                        <p className="text-xs text-amber-600 mt-1">Please check if this is the correct file before confirming.</p>
                                    </div>

                                    <div className="border rounded-lg overflow-hidden bg-muted/30 p-4 flex flex-col items-center justify-center min-h-[200px]">
                                        {previewUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="max-h-64 object-contain shadow-sm rounded"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 py-8">
                                                <FileImage className="h-16 w-16 text-muted-foreground/40" />
                                                <p className="text-sm font-medium">{pendingFile.name}</p>
                                                <p className="text-xs text-muted-foreground">PDF Document</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={confirmUpload}
                                            disabled={isUploading}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {isUploading ? (
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                                            ) : (
                                                <><CheckCircle2 className="h-4 w-4 mr-2" />Confirm & Upload</>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={cancelSelection}
                                            disabled={isUploading}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center space-y-4">
                                    <div className="flex justify-center">
                                        <div className="rounded-full bg-primary/10 p-3">
                                            <Upload className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Upload your payment receipt
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Accepted: JPG, PNG, WebP, PDF (max 5MB)
                                        </p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />Choose File
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
