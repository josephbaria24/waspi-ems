//components\forms\registration-form.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MEMBERSHIP_SETTINGS,
  MembershipSettings,
  formatPeso,
  getPlan,
} from "@/lib/membership-settings";

const fieldClass =
  "h-9 rounded-xl border-[#E8EAEB] bg-white text-sm shadow-none focus-visible:border-[#00D47E] focus-visible:ring-[#00D47E]/20";
const labelClass = "text-xs font-medium text-[#1E1E1E]";

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
  const [membershipSettings, setMembershipSettings] = useState<MembershipSettings>(DEFAULT_MEMBERSHIP_SETTINGS);
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
    wantsPhysicalId: false,
    useRegisteredAddress: false,
    deliveryRecipient: "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryProvince: "",
    deliveryZip: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/membership/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data.settings) setMembershipSettings(data.settings);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [stepperStep]);

  const selectedPlan = getPlan(membershipSettings, formData.membershipType);
  const membershipPrice = formData.membershipType ? selectedPlan.price : 0;
  const physicalIdFee = formData.wantsPhysicalId ? membershipSettings.physicalIdFee : 0;
  const shippingFee = formData.wantsPhysicalId ? membershipSettings.shippingFee : 0;
  const orderTotal = membershipPrice + physicalIdFee + shippingFee;

  const applyRegisteredAddress = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      useRegisteredAddress: checked,
      deliveryRecipient: checked ? `${prev.firstName} ${prev.lastName}`.trim() : prev.deliveryRecipient,
      deliveryAddress: checked ? prev.address : prev.deliveryAddress,
      deliveryCity: checked ? prev.city : prev.deliveryCity,
      deliveryZip: checked ? prev.zipCode : prev.deliveryZip,
    }));
  };

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

      if (formData.wantsPhysicalId) {
        const deliveryFields = [
          "deliveryRecipient",
          "deliveryAddress",
          "deliveryCity",
          "deliveryProvince",
          "deliveryZip",
        ] as const;
        deliveryFields.forEach((field) => {
          if (!formData[field].trim()) newErrors[field] = true;
        });
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          toast({
            title: "Delivery Address Required",
            description: "Please complete the delivery address for your physical ID.",
            variant: "destructive",
          });
          return false;
        }
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
      <Card className="rounded-[28px] border border-[#E8EAEB] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-6 py-10 text-center">
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

          {formData.wantsPhysicalId && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 max-w-md mx-auto text-left space-y-2">
              <p className="text-sm font-semibold text-emerald-800">
                Physical ID delivery
              </p>
              <p className="text-sm text-emerald-800/80">
                Your printed ID will be shipped after payment is confirmed. Delivery address:{" "}
                <strong>
                  {formData.deliveryRecipient}, {formData.deliveryAddress}, {formData.deliveryCity}, {formData.deliveryProvince} {formData.deliveryZip}
                </strong>
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
    <Card className="overflow-visible rounded-[28px] border border-[#E8EAEB] bg-white py-0 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
      <CardContent className="px-6 py-6 sm:px-8 sm:py-7">
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
            stepContainerClassName="!px-0"
            contentClassName="!px-0"
            footerClassName="!px-0"
          >
            {/* Step 1: Personal Information */}
            <Step>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className={labelClass}>
                      First name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Juan"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className={cn(fieldClass, errors.firstName && "border-red-500")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className={labelClass}>
                      Last name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Dela Cruz"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className={cn(fieldClass, errors.lastName && "border-red-500")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.4fr)_180px]">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className={labelClass}>
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={cn(fieldClass, errors.email && "border-red-500")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className={labelClass}>
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="09xx xxx xxxx"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className={cn(fieldClass, errors.phone && "border-red-500")}
                    />
                  </div>
                </div>

                <div className="w-[180px] space-y-1.5">
                  <Label htmlFor="dateOfBirth" className={labelClass}>
                    Date of birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    className={cn(fieldClass, errors.dateOfBirth && "border-red-500")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className={labelClass}>
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={6}
                        className={cn(fieldClass, "pr-9", errors.password && "border-red-500")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8D959D] hover:text-[#1E1E1E]"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className={labelClass}>
                      Confirm password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        minLength={6}
                        className={cn(fieldClass, "pr-9", errors.confirmPassword && "border-red-500")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8D959D] hover:text-[#1E1E1E]"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-[#E8EAEB] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D959D]">Address</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className={labelClass}>
                      Street address
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="House no., street, barangay"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className={cn(fieldClass, errors.address && "border-red-500")}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="w-full max-w-[220px] space-y-1.5">
                      <Label htmlFor="city" className={labelClass}>
                        City
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className={cn(fieldClass, errors.city && "border-red-500")}
                      />
                    </div>
                    <div className="w-[120px] space-y-1.5">
                      <Label htmlFor="zipCode" className={labelClass}>
                        ZIP
                      </Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        placeholder="1000"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        className={cn(fieldClass, errors.zipCode && "border-red-500")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 2: Membership Selection */}
            <Step>
              <div className="space-y-5">
                <div className="space-y-2 text-center">
                  <Label className="text-base font-semibold text-[#1E1E1E]">
                    Select membership
                  </Label>
                  <p className="text-sm text-[#8D959D]">
                    Choose the plan that best fits your profile
                  </p>
                  <div className="mt-4 grid grid-cols-1 items-start justify-items-stretch gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {membershipSettings.plans.map((type) => (
                      <MembershipCard3D
                        key={type.id}
                        type={type.id}
                        name={type.name}
                        price={`${formatPeso(type.price)}/year`}
                        selected={formData.membershipType === type.id}
                        onSelect={() =>
                          handleSelectChange("membershipType", type.id)
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E8EAEB] bg-[#F7FBF8] p-4">
                  <p className="text-sm font-bold text-emerald-800 mb-4 uppercase tracking-wider">
                    {selectedPlan.name} Benefits:
                  </p>
                  <ul className="text-sm text-emerald-700/80 space-y-3 list-none">
                    {selectedPlan.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Step>

            {/* Step 3: Payment Information */}
            <Step>
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="w-full max-w-xs space-y-1.5">
                    <Label
                      htmlFor="paymentMethod"
                      className={labelClass}
                    >
                      Payment method
                    </Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        handleSelectChange("paymentMethod", value)
                      }
                    >
                      <SelectTrigger className={cn(
                        "h-9 rounded-xl border-[#E8EAEB] text-sm shadow-none",
                        errors.paymentMethod && "border-red-500"
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

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                    <label
                      htmlFor="wantsPhysicalId"
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E8EAEB] bg-[#F7FBF8] p-3"
                    >
                      <Checkbox
                        id="wantsPhysicalId"
                        checked={formData.wantsPhysicalId}
                        onCheckedChange={(checked) => {
                          const wantsPhysicalId = checked === true;
                          setFormData((prev) => ({
                            ...prev,
                            wantsPhysicalId,
                            useRegisteredAddress: wantsPhysicalId ? prev.useRegisteredAddress : false,
                          }));
                          if (!wantsPhysicalId) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.deliveryRecipient;
                              delete next.deliveryAddress;
                              delete next.deliveryCity;
                              delete next.deliveryProvince;
                              delete next.deliveryZip;
                              return next;
                            });
                          }
                        }}
                        className="mt-0.5 size-5 border-2 border-[#1E1E1E] bg-white data-[state=checked]:border-[#00D47E] data-[state=checked]:bg-[#00D47E] data-[state=checked]:text-black"
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-semibold text-[#1E1E1E]">
                          I want a physical membership ID
                        </span>
                        <span className="block text-xs text-gray-500">
                          Adds {formatPeso(membershipSettings.physicalIdFee)} for the printed ID and {formatPeso(membershipSettings.shippingFee)} shipping. A delivery address is required.
                        </span>
                      </span>
                    </label>

                    {formData.wantsPhysicalId && (
                      <div className="space-y-4 border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="useRegisteredAddress"
                            checked={formData.useRegisteredAddress}
                            onCheckedChange={(checked) => applyRegisteredAddress(checked === true)}
                            className="size-5 border-2 border-[#1E1E1E] bg-white data-[state=checked]:border-[#00D47E] data-[state=checked]:bg-[#00D47E] data-[state=checked]:text-black"
                          />
                          <Label htmlFor="useRegisteredAddress" className="text-sm text-gray-700 cursor-pointer">
                            Use my registered address
                          </Label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="deliveryRecipient" className={labelClass}>Recipient name</Label>
                          <Input
                            id="deliveryRecipient"
                            name="deliveryRecipient"
                            placeholder="Full name of recipient"
                            value={formData.deliveryRecipient}
                            onChange={handleInputChange}
                            className={cn(fieldClass, "max-w-sm", errors.deliveryRecipient && "border-red-500")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deliveryAddress" className={labelClass}>Street address</Label>
                          <Input
                            id="deliveryAddress"
                            name="deliveryAddress"
                            placeholder="House no., street, barangay"
                            value={formData.deliveryAddress}
                            onChange={handleInputChange}
                            className={cn(fieldClass, errors.deliveryAddress && "border-red-500")}
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <div className="w-full max-w-[200px] space-y-1.5">
                            <Label htmlFor="deliveryCity" className={labelClass}>City</Label>
                            <Input
                              id="deliveryCity"
                              name="deliveryCity"
                              placeholder="City"
                              value={formData.deliveryCity}
                              onChange={handleInputChange}
                              className={cn(fieldClass, errors.deliveryCity && "border-red-500")}
                            />
                          </div>
                          <div className="w-full max-w-[200px] space-y-1.5">
                            <Label htmlFor="deliveryProvince" className={labelClass}>Province</Label>
                            <Input
                              id="deliveryProvince"
                              name="deliveryProvince"
                              placeholder="Province"
                              value={formData.deliveryProvince}
                              onChange={handleInputChange}
                              className={cn(fieldClass, errors.deliveryProvince && "border-red-500")}
                            />
                          </div>
                          <div className="w-[120px] space-y-1.5">
                            <Label htmlFor="deliveryZip" className={labelClass}>ZIP</Label>
                            <Input
                              id="deliveryZip"
                              name="deliveryZip"
                              placeholder="1000"
                              value={formData.deliveryZip}
                              onChange={handleInputChange}
                              className={cn(fieldClass, errors.deliveryZip && "border-red-500")}
                            />
                          </div>
                        </div>
                      </div>
                    )}
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
                              <p className="text-xs"><span className="font-bold">Bank / Branch:</span> Landbank of the Philippines / Davao City</p>
                              <p className="text-xs"><span className="font-bold">Savings Account Name:</span> Workplace Advocates on Safety in the Philippines, Inc.</p>
                              <p className="text-xs"><span className="font-bold">Bank Account Number:</span> <span className="font-mono">5911-0175-73</span></p>
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
                      {formData.membershipType ? selectedPlan.name : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Membership fee</span>
                    <span className="font-medium text-gray-900">{formatPeso(membershipPrice)}</span>
                  </div>
                  {formData.wantsPhysicalId && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Physical ID</span>
                        <span className="font-medium text-gray-900">{formatPeso(membershipSettings.physicalIdFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Shipping fee</span>
                        <span className="font-medium text-gray-900">{formatPeso(membershipSettings.shippingFee)}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total Due:</span>
                    <span className="text-xl font-black text-emerald-600">
                      {formatPeso(orderTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </Step>

            <Step>
              <div className="space-y-4">
                <div className="space-y-1 text-center">
                  <Label className="text-base font-semibold text-[#1E1E1E]">
                    Confirm your registration
                  </Label>
                  <p className="text-sm text-[#8D959D]">
                    Review the summary below. Nothing is submitted until you confirm.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E8EAEB] bg-white p-4 sm:p-5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Applicant</p>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-[#1E1E1E] text-right">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-[#1E1E1E] text-right">{formData.email}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium text-[#1E1E1E] text-right">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-500">Address</span>
                    <span className="font-medium text-[#1E1E1E] text-right">
                      {formData.address}, {formData.city} {formData.zipCode}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E8EAEB] bg-[#F7FBF8] p-4 sm:p-5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Membership</p>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-500">Plan</span>
                    <span className="font-semibold text-[#1E1E1E]">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-500">Membership fee</span>
                    <span className="font-medium text-[#1E1E1E]">{formatPeso(membershipPrice)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-500">Payment method</span>
                    <span className="font-medium text-[#1E1E1E] text-right">
                      {formData.paymentMethod === "ewallet"
                        ? "E-wallets (GCash/Maya)"
                        : formData.paymentMethod === "bank"
                          ? "Bank Transfer"
                          : "Cash (In-person)"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-500">Physical ID</span>
                    <span className="font-medium text-[#1E1E1E]">
                      {formData.wantsPhysicalId ? `Yes · ${formatPeso(membershipSettings.physicalIdFee)}` : "No"}
                    </span>
                  </div>
                  {formData.wantsPhysicalId && (
                    <>
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="text-gray-500">Shipping</span>
                        <span className="font-medium text-[#1E1E1E]">{formatPeso(membershipSettings.shippingFee)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="text-gray-500">Delivery</span>
                        <span className="font-medium text-[#1E1E1E] text-right">
                          {formData.deliveryRecipient}, {formData.deliveryAddress}, {formData.deliveryCity}, {formData.deliveryProvince} {formData.deliveryZip}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-[#E8EAEB] pt-3 flex justify-between items-center">
                    <span className="font-bold text-[#1E1E1E]">Total due</span>
                    <span className="text-xl font-black text-emerald-600">{formatPeso(orderTotal)}</span>
                  </div>
                </div>
              </div>
            </Step>
          </Stepper>
        </form>
      </CardContent>
    </Card>  );
}
