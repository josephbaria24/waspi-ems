//components\forms\registration-form.tsx
"use client";

import { useState } from "react";
import { Eye, EyeOff, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembershipCard3D } from "@/components/ui/membership-card-3d";
import { toast } from "sonner";

interface RegistrationFormProps {
    onSuccess?: () => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
    const [currentStep, setCurrentStep] = useState("personal");
    const [isLoading, setIsLoading] = useState(false);
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        password: "",
        confirmPassword: "",
        membershipType: "",
        company: "",
        position: "",
        address: "",
        city: "",
        country: "",
        zipCode: "",
        companyAddress: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const isPersonalStepValid = () => {
        const requiredFields = [
            "firstName", "middleName", "lastName", "email", "phone",
            "dateOfBirth", "password", "confirmPassword", "company",
            "position", "address", "city", "country", "zipCode", "companyAddress"
        ];

        const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.trim());

        if (missingFields.length > 0) {
            return { valid: false, message: "Please fill in all personal and professional information." };
        }

        if (formData.password !== formData.confirmPassword) {
            return { valid: false, message: "Passwords do not match." };
        }

        if (formData.password.length < 6) {
            return { valid: false, message: "Password must be at least 6 characters long." };
        }

        return { valid: true };
    };

    const isMembershipStepValid = () => {
        if (!formData.membershipType) {
            return { valid: false, message: "Please select a membership plan." };
        }
        return { valid: true };
    };

    const goToMembership = () => {
        const validation = isPersonalStepValid();
        if (validation.valid) {
            setCurrentStep("membership");
        } else {
            toast.error("Incomplete Step", {
                description: validation.message,
            });
        }
    };

    const goToReview = () => {
        const validation = isMembershipStepValid();
        if (validation.valid) {
            setCurrentStep("review");
        } else {
            toast.error("Membership Required", {
                description: validation.message,
            });
        }
    };

    const getMembershipPrice = () => {
        switch (formData.membershipType) {
            case "standard": return "₱100.00";
            case "premium": return "₱150.00";
            case "organizational": return "₱300.00";
            default: return "—";
        }
    };

    const getMembershipLabel = () => {
        switch (formData.membershipType) {
            case "standard": return "Student Member";
            case "premium": return "Professional Member";
            case "organizational": return "Organizational Member";
            default: return "—";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            toast.error("Password Mismatch", {
                description: "Passwords do not match. Please try again.",
            });
            setIsLoading(false);
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            toast.error("Weak Password", {
                description: "Password must be at least 6 characters long.",
            });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error("Registration Failed", {
                    description: data.error || "Something went wrong. Please try again.",
                });
                return;
            }

            setTrackingNumber(data.trackingNumber);
            setRegistrationComplete(true);

            toast.success("Registration Successful!", {
                description: `Your tracking number is ${data.trackingNumber}`,
            });

            onSuccess?.();
        } catch (error) {
            console.error("Registration error:", error);
            toast.error("Error", {
                description: "Failed to register. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyTrackingNumber = () => {
        navigator.clipboard.writeText(trackingNumber);
        toast.success("Copied!", { description: "Tracking number copied to clipboard." });
    };

    // ==================== SUCCESS SCREEN ====================
    if (registrationComplete) {
        return (
            <Card className="border-2 border-green-500/30 shadow-lg">
                <CardContent className="py-12 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-green-500/10 p-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-foreground">
                            Registration Successful!
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Your membership application has been submitted. Please save your tracking number and upload your payment receipt.
                        </p>
                    </div>

                    <div className="bg-muted/50 border-2 border-dashed border-primary/30 rounded-lg p-6 max-w-sm mx-auto">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                            Your Tracking Number
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-2xl font-mono font-bold text-primary">
                                {trackingNumber}
                            </p>
                            <button
                                type="button"
                                onClick={copyTrackingNumber}
                                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                title="Copy tracking number"
                            >
                                <Copy className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 max-w-md mx-auto text-left space-y-2">
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                            📋 Next Steps:
                        </p>
                        <ol className="text-sm text-amber-700/80 dark:text-amber-400/80 space-y-1 list-decimal list-inside">
                            <li>Save your tracking number</li>
                            <li>Send your payment to the WASPI account</li>
                            <li>Upload your payment receipt in the Member Portal</li>
                            <li>Wait for admin approval</li>
                        </ol>
                    </div>

                    <Button
                        onClick={() => window.location.href = "/membership/portal"}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Go to Member Portal
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // ==================== REGISTRATION FORM ====================
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-primary/10">
                    <CardTitle>Member Registration</CardTitle>
                    <CardDescription>
                        Complete all sections to register for WASPI membership
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <Tabs
                        value={currentStep}
                        onValueChange={setCurrentStep}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50">
                            <TabsTrigger value="personal" className="text-xs sm:text-sm">
                                Personal Info
                            </TabsTrigger>
                            <TabsTrigger
                                value="membership"
                                className="text-xs sm:text-sm"
                                disabled={!isPersonalStepValid().valid}
                            >
                                Membership
                            </TabsTrigger>
                            <TabsTrigger
                                value="review"
                                className="text-xs sm:text-sm"
                                disabled={!isPersonalStepValid().valid || !isMembershipStepValid().valid}
                            >
                                Review & Submit
                            </TabsTrigger>
                        </TabsList>

                        {/* Personal Information Tab */}
                        <TabsContent value="personal" className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-foreground">
                                        First Name *
                                    </Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                        className="border-input focus:border-primary focus:ring-primary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="middleName" className="text-foreground">
                                        Middle Name *
                                    </Label>
                                    <Input
                                        id="middleName"
                                        name="middleName"
                                        placeholder="Quincy"
                                        value={formData.middleName}
                                        onChange={handleInputChange}
                                        required
                                        className="border-input focus:border-primary focus:ring-primary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-foreground">
                                        Last Name *
                                    </Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                        className="border-input focus:border-primary focus:ring-primary/30"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-foreground">
                                        Email *
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="border-input focus:border-primary focus:ring-primary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-foreground">
                                        Phone Number *
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="+63 917 123 4567"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        className="border-input focus:border-primary focus:ring-primary/30"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth" className="text-foreground">
                                    Date of Birth *
                                </Label>
                                <Input
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                    required
                                    className="border-input focus:border-primary focus:ring-primary/30"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company" className="text-foreground">
                                        Company *
                                    </Label>
                                    <Input
                                        id="company"
                                        name="company"
                                        placeholder="Acme Inc."
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        required
                                        className="border-input focus:border-primary focus:ring-primary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="position" className="text-foreground">
                                        Position *
                                    </Label>
                                    <Input
                                        id="position"
                                        name="position"
                                        placeholder="Architect"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        required
                                        className="border-input focus:border-primary focus:ring-primary/30"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-foreground">
                                        Password *
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Minimum 6 characters"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required
                                            minLength={6}
                                            className="border-input focus:border-primary focus:ring-primary/30 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-foreground">
                                        Confirm Password *
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Re-enter your password"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            required
                                            minLength={6}
                                            className="border-input focus:border-primary focus:ring-primary/30 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="font-semibold text-foreground">Address</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-foreground">
                                        Street Address *
                                    </Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        placeholder="123 Main Street"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                        className="border-input focus:border-primary focus:ring-primary/30"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-foreground">
                                            City *
                                        </Label>
                                        <Input
                                            id="city"
                                            name="city"
                                            placeholder="Manila"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            required
                                            className="border-input focus:border-primary focus:ring-primary/30"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country" className="text-foreground">
                                            Country *
                                        </Label>
                                        <Select
                                            value={formData.country}
                                            onValueChange={(value) =>
                                                handleSelectChange("country", value)
                                            }
                                        >
                                            <SelectTrigger className="border-input focus:border-primary focus:ring-primary/30">
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Philippines">Philippines</SelectItem>
                                                <SelectItem value="United States">United States</SelectItem>
                                                <SelectItem value="Canada">Canada</SelectItem>
                                                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                                <SelectItem value="Australia">Australia</SelectItem>
                                                <SelectItem value="Japan">Japan</SelectItem>
                                                <SelectItem value="Singapore">Singapore</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zipCode" className="text-foreground">
                                            ZIP Code *
                                        </Label>
                                        <Input
                                            id="zipCode"
                                            name="zipCode"
                                            placeholder="1000"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            required
                                            className="border-input focus:border-primary focus:ring-primary/30"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="companyAddress" className="text-foreground">
                                        Company Address *
                                    </Label>
                                    <Input
                                        id="companyAddress"
                                        name="companyAddress"
                                        placeholder="456 Business Park, Metro Manila"
                                        value={formData.companyAddress}
                                        onChange={handleInputChange}
                                        required
                                        className="border-input focus:border-primary focus:ring-primary/30"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button
                                    type="button"
                                    onClick={goToMembership}
                                    disabled={isLoading}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                                >
                                    Next Step
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Membership Tab */}
                        <TabsContent value="membership" className="space-y-6 mt-6">
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Label className="text-foreground font-semibold">
                                        Select Membership Type *
                                    </Label>
                                    <p className="text-sm text-foreground/60">
                                        Hover over the cards to see the 3D effect
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 justify-items-center">
                                        {[
                                            {
                                                id: "standard" as const,
                                                name: "Student Member",
                                                price: "₱100/year",
                                            },
                                            {
                                                id: "premium" as const,
                                                name: "Professional Member",
                                                price: "₱150/year",
                                            },
                                            {
                                                id: "elite" as const,
                                                name: "Organizational Member",
                                                price: "₱300/year",
                                            },
                                        ].map((type) => (
                                            <div key={type.id} className="w-full flex justify-center">
                                                <MembershipCard3D
                                                    type={type.id}
                                                    name={type.name}
                                                    price={type.price}
                                                    selected={formData.membershipType === type.id}
                                                    onSelect={() =>
                                                        handleSelectChange("membershipType", type.id)
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <input
                                        type="hidden"
                                        name="membershipType"
                                        value={formData.membershipType}
                                        required
                                    />
                                </div>

                                <div className="bg-muted/50 border border-primary/20 rounded-lg p-4 mt-6">
                                    <p className="text-sm font-semibold text-foreground mb-3">
                                        {formData.membershipType === "elite"
                                            ? "Organizational Benefits:"
                                            : formData.membershipType === "premium"
                                                ? "Premium Benefits:"
                                                : "Standard Benefits:"}
                                    </p>
                                    <ul className="text-sm text-foreground/70 space-y-2 list-disc list-inside">
                                        {formData.membershipType === "standard" && (
                                            <>
                                                <li>Basic event access</li>
                                                <li>Digital membership card</li>
                                                <li>Monthly newsletter</li>
                                            </>
                                        )}
                                        {formData.membershipType === "premium" && (
                                            <>
                                                <li>Priority event registration</li>
                                                <li>Exclusive member webinars</li>
                                                <li>Discounts on certification</li>
                                            </>
                                        )}
                                        {formData.membershipType === "elite" && (
                                            <>
                                                <li>VIP networking events</li>
                                                <li>Direct professional mentorship</li>
                                                <li>Access to exclusive resources</li>
                                                <li>Voting rights in general assembly</li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex justify-between gap-3 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCurrentStep("personal")}
                                    disabled={isLoading}
                                    className="border-primary/30 hover:bg-muted disabled:opacity-50"
                                >
                                    Previous
                                </Button>
                                <Button
                                    type="button"
                                    onClick={goToReview}
                                    disabled={isLoading}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                                >
                                    Next Step
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Review & Submit Tab */}
                        <TabsContent value="review" className="space-y-6 mt-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-foreground text-lg">
                                    Review Your Information
                                </h3>

                                <div className="bg-muted/30 border border-border rounded-lg divide-y divide-border">
                                    {/* Personal Info Summary */}
                                    <div className="p-4 space-y-2">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Personal Information</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground">{formData.firstName} {formData.middleName} {formData.lastName}</span></div>
                                            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{formData.email}</span></div>
                                            <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-foreground">{formData.phone}</span></div>
                                            <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium text-foreground">{formData.dateOfBirth}</span></div>
                                        </div>
                                    </div>

                                    {/* Professional Info Summary */}
                                    <div className="p-4 space-y-2">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Professional Information</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                            <div><span className="text-muted-foreground">Company:</span> <span className="font-medium text-foreground">{formData.company}</span></div>
                                            <div><span className="text-muted-foreground">Position:</span> <span className="font-medium text-foreground">{formData.position}</span></div>
                                            <div className="sm:col-span-2"><span className="text-muted-foreground">Company Address:</span> <span className="font-medium text-foreground">{formData.companyAddress}</span></div>
                                        </div>
                                    </div>

                                    {/* Address Summary */}
                                    <div className="p-4 space-y-2">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Address</p>
                                        <p className="text-sm font-medium text-foreground">
                                            {formData.address}, {formData.city}, {formData.country} {formData.zipCode}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="bg-card border-2 border-primary/20 rounded-lg p-4 space-y-2">
                                    <p className="text-sm font-semibold text-foreground">
                                        Order Summary
                                    </p>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-foreground/70">Membership Type:</span>
                                        <span className="font-medium text-foreground">
                                            {getMembershipLabel()}
                                        </span>
                                    </div>
                                    <div className="border-t border-border pt-2 flex justify-between">
                                        <span className="font-semibold text-foreground">Total:</span>
                                        <span className="font-bold text-primary">
                                            {getMembershipPrice()}
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Instructions */}
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2">
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                                        💳 Payment Instructions
                                    </p>
                                    <p className="text-sm text-blue-700/80 dark:text-blue-400/80">
                                        After registration, you will receive a <strong>tracking number</strong>.
                                        Please send payment to the WASPI account and upload your receipt in the
                                        <strong> Member Portal</strong>. An admin will review and approve your membership.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between gap-3 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCurrentStep("membership")}
                                    disabled={isLoading}
                                    className="border-primary/30 hover:bg-muted disabled:opacity-50"
                                >
                                    Previous
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                                >
                                    {isLoading ? "Processing..." : "Submit Registration"}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </form>
    );
}
