//components\forms\registration-form.tsx
"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import Stepper, { Step } from "@/components/Stepper";
import { Eye, EyeOff, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationFormProps {
  onSuccess?: () => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const { toast } = useToast();
  const [stepperStep, setStepperStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
    membershipType: "",
    address: "",
    city: "",
    zipCode: "",
    paymentMethod: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVC: "",
    cardName: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, boolean> = {};

    if (step === 1) {
      const requiredFields = [
        "firstName", "lastName", "email", "phone", "dateOfBirth",
        "password", "confirmPassword", "address", "city", "zipCode"
      ];
      
      requiredFields.forEach(field => {
        if (!formData[field as keyof typeof formData]) {
          newErrors[field] = true;
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields highlighted in red.",
          variant: "destructive",
        });
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setErrors({ password: true, confirmPassword: true });
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match.",
          variant: "destructive",
        });
        return false;
      }

      if (formData.password.length < 6) {
        setErrors({ password: true });
        toast({
          title: "Weak Password",
          description: "Password must be at least 6 characters long.",
          variant: "destructive",
        });
        return false;
      }
    } else if (step === 2) {
      if (!formData.membershipType) {
        toast({
          title: "Selection Required",
          description: "Please select a membership type.",
          variant: "destructive",
        });
        return false;
      }
    } else if (step === 3) {
      if (!formData.paymentMethod) {
        setErrors({ paymentMethod: true });
        toast({
          title: "Payment Method Required",
          description: "Please select a payment method.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    setErrors({});
    return true;
  };

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(trackingNumber);
    toast({ title: "Copied!", description: "Tracking number copied to clipboard." });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

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
        toast({
          title: "Registration Failed",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Set success state
      setTrackingNumber(data.trackingNumber);
      setRegistrationComplete(true);

      // Send confirmation email in the background
      try {
        await fetch("/api/membership/send-registration-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            fullName: `${formData.firstName} ${formData.lastName}`,
            trackingNumber: data.trackingNumber,
            membershipType: formData.membershipType,
            paymentMethod: formData.paymentMethod,
          }),
        });
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
      }

      toast({
        title: "Registration Successful",
        description: `Your tracking number is ${data.trackingNumber}`,
      });

      onSuccess?.();
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: "Failed to register. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== SUCCESS SCREEN ====================
  if (registrationComplete) {
    return (
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardContent className="py-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Registration Successful!
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your membership application has been submitted. A confirmation email has been sent to <strong>{formData.email}</strong>.
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

          {(formData.paymentMethod === "ewallet" || formData.paymentMethod === "bank") && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 max-w-md mx-auto text-left space-y-2">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                📋 Payment Required
              </p>
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80">
                Since you selected <strong>{formData.paymentMethod === "ewallet" ? "E-wallet" : "Bank Transfer"}</strong>, please complete your payment and upload a screenshot of your receipt.
              </p>
              <Button
                onClick={() => window.location.href = `/membership/upload-receipt?tracking=${trackingNumber}`}
                variant="outline"
                className="mt-2 border-amber-500/30 text-amber-700 hover:bg-amber-50 gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Upload Payment Receipt
              </Button>
            </div>
          )}

          {formData.paymentMethod === "cash" && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 max-w-md mx-auto text-left space-y-2">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                💳 In-Person Payment
              </p>
              <p className="text-sm text-blue-700/80 dark:text-blue-400/80">
                Please visit our office to settle your payment. Bring a valid ID and mention your tracking number <strong>{trackingNumber}</strong>.
              </p>
            </div>
          )}

          <div className="bg-muted/30 border border-border rounded-lg p-4 max-w-md mx-auto text-left space-y-2">
            <p className="text-sm font-semibold text-foreground">Next Steps:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Save your tracking number</li>
              <li>Complete your payment</li>
              {(formData.paymentMethod === "ewallet" || formData.paymentMethod === "bank") && (
                <li>Upload your payment receipt</li>
              )}
              <li>Wait for admin approval (24-48 hours)</li>
            </ol>
          </div>

          <Button
            onClick={() => window.location.href = "/"}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Back to Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ==================== REGISTRATION FORM ====================
  return (
    <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-primary/10">
        <CardTitle>Member Registration</CardTitle>
        <CardDescription>
          Complete all sections to register for WASPI membership
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <Stepper
            value={stepperStep}
            onValueChange={setStepperStep}
            onBeforeNext={validateStep}
            onFinalStepCompleted={() => handleSubmit()}
            backButtonText="Previous"
            nextButtonText="Next Step"
            nextButtonProps={{ disabled: isLoading }}
            backButtonProps={{ disabled: isLoading }}
          >
            {/* Step 1: Personal Information */}
            <Step>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className={cn(
                        "border-input focus:border-primary focus:ring-primary/30",
                        errors.firstName && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      )}
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
                      className={cn(
                        "border-input focus:border-primary focus:ring-primary/30",
                        errors.lastName && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      )}
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
                      className={cn(
                        "border-input focus:border-primary focus:ring-primary/30",
                        errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      )}
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
                      placeholder="+63 912 345 6789"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className={cn(
                        "border-input focus:border-primary focus:ring-primary/30",
                        errors.phone && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      )}
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
                    className={cn(
                      "border-input focus:border-primary focus:ring-primary/30",
                      errors.dateOfBirth && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                    )}
                  />
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
                        className={cn(
                          "border-input focus:border-primary focus:ring-primary/30 pr-10",
                          errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                        className={cn(
                          "border-input focus:border-primary focus:ring-primary/30 pr-10",
                          errors.confirmPassword && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                      className={cn(
                        "border-input focus:border-primary focus:ring-primary/30",
                        errors.address && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-foreground">
                        City *
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className={cn(
                          "border-input focus:border-primary focus:ring-primary/30",
                          errors.city && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-foreground">
                        ZIP Code *
                      </Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        placeholder="12345"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        className={cn(
                          "border-input focus:border-primary focus:ring-primary/30",
                          errors.zipCode && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 2: Membership Selection */}
            <Step>
              <div className="space-y-6 py-4">
                <div className="space-y-3 text-center">
                  <Label className="text-lg font-bold text-gray-900">
                    Select Membership Type *
                  </Label>
                  <p className="text-sm text-gray-500">
                    Choose the plan that best fits your profile
                  </p>
                  <div className="flex flex-col lg:flex-row gap-4 mt-6 items-center justify-center">
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
                      <MembershipCard3D
                        key={type.id}
                        type={type.id}
                        name={type.name}
                        price={type.price}
                        selected={formData.membershipType === type.id}
                        onSelect={() =>
                          handleSelectChange("membershipType", type.id)
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mt-6">
                  <p className="text-sm font-bold text-emerald-800 mb-4 uppercase tracking-wider">
                    {formData.membershipType === "elite"
                      ? "Organizational Member Benefits:"
                      : formData.membershipType === "premium"
                        ? "Professional Member Benefits:"
                        : "Student Member Benefits:"}
                  </p>
                  <ul className="text-sm text-emerald-700/80 space-y-3 list-none">
                    {formData.membershipType === "standard" && (
                      <>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Access to member portal</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Digital membership card</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Monthly newsletter</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Exclusive events and offers</li>
                      </>
                    )}
                    {formData.membershipType === "premium" && (
                      <>
                        <li className="flex items-center gap-2 font-semibold text-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All of student member benefits</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Priority customer support</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Exclusive discounts</li>
                      </>
                    )}
                    {formData.membershipType === "elite" && (
                      <>
                        <li className="flex items-center gap-2 font-semibold text-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All of professional member benefits</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> VIP event access</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Personal account manager</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Early access to new features</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </Step>

            {/* Step 3: Payment Information */}
            <Step>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label
                      htmlFor="paymentMethod"
                      className="text-foreground font-semibold"
                    >
                      Payment Method *
                    </Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        handleSelectChange("paymentMethod", value)
                      }
                    >
                      <SelectTrigger className={cn(
                        "border-input focus:border-primary focus:ring-primary/30",
                        errors.paymentMethod && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      )}>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash (In-person)</SelectItem>
                        <SelectItem value="ewallet">E-wallets (GCash/Maya)</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.paymentMethod && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-gray-900 font-bold">Payment Instructions</p>
                          <p className="text-xs text-gray-500">Follow the steps below to complete your registration</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-sm text-gray-700">
                        {formData.paymentMethod === "cash" && (
                          <p>Please visit our office to settle your payment. Bring a valid ID and mention your Member ID once generated.</p>
                        )}
                        {formData.paymentMethod === "ewallet" && (
                          <div className="space-y-2">
                            <p>Send your payment to any of the following accounts:</p>
                            <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-emerald-100">
                              <div>
                                <p className="font-bold text-xs uppercase text-gray-400">GCash</p>
                                <p className="font-mono text-emerald-600">0912 345 6789</p>
                              </div>
                              <div>
                                <p className="font-bold text-xs uppercase text-gray-400">Maya</p>
                                <p className="font-mono text-emerald-600">0912 345 6789</p>
                              </div>
                            </div>
                            <p className="text-xs italic text-gray-500">Please save a screenshot of your transaction for verification.</p>
                          </div>
                        )}
                        {formData.paymentMethod === "bank" && (
                          <div className="space-y-2">
                            <p>Transfer the total amount to our corporate account:</p>
                            <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-1">
                              <p className="text-xs"><span className="font-bold">Bank:</span> BPI</p>
                              <p className="text-xs"><span className="font-bold">Account Name:</span> WASPI ORG</p>
                              <p className="text-xs"><span className="font-bold">Account Number:</span> 1234-5678-90</p>
                            </div>
                            <p className="text-xs italic text-gray-500">Verification may take 1-2 business days.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3">
                  <p className="text-sm font-bold text-gray-900">
                    Order Summary
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Membership Type:</span>
                    <span className="font-bold text-gray-900 capitalize">
                      {formData.membershipType} Plan
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total Due:</span>
                    <span className="text-xl font-black text-emerald-600">
                      {formData.membershipType === "standard" && "₱100.00"}
                      {formData.membershipType === "premium" && "₱150.00"}
                      {formData.membershipType === "elite" && "₱300.00"}
                    </span>
                  </div>
                </div>
              </div>
            </Step>
          </Stepper>
        </form>
      </CardContent>
    </Card>  );
}
