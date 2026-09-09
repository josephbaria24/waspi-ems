"use client"

import { useEffect, useState, type ComponentType } from "react"
import {
  ArrowLeft,
  Award,
  Briefcase,
  Building2,
  Check,
  GraduationCap,
  IdCard,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Truck,
  Upload,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  DEFAULT_MEMBERSHIP_SETTINGS,
  MembershipSettings,
  formatPeso,
} from "@/lib/membership-settings"

const typeStyle = { fontFamily: "Aeonik, Geist, -apple-system, BlinkMacSystemFont, sans-serif" }

const planThemes = {
  standard: {
    icon: GraduationCap,
    label: "Student",
    accent: "#3B82F6",
    soft: "#EFF6FF",
    ink: "#1E3A8A",
  },
  premium: {
    icon: Briefcase,
    label: "Professional",
    accent: "#F59E0B",
    soft: "#FFFBEB",
    ink: "#92400E",
  },
  elite: {
    icon: Building2,
    label: "Organizational",
    accent: "#00D47E",
    soft: "#EAF9F1",
    ink: "#14532D",
  },
} as const

const fieldClass =
  "h-10 rounded-xl border-[#E8EAEB] bg-white text-sm text-[#1E1E1E] shadow-none focus-visible:border-[#00D47E] focus-visible:ring-[#00D47E]/20"

export function MembershipSetup({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<MembershipSettings>(DEFAULT_MEMBERSHIP_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch("/api/membership/settings", { cache: "no-store" })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        if (!cancelled) setSettings(data.settings)
      } catch (error: any) {
        toast.error("Could not load setup", { description: error.message })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const updatePlan = (id: string, patch: Partial<MembershipSettings["plans"][number]>) => {
    setSettings((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) => (plan.id === id ? { ...plan, ...patch } : plan)),
    }))
  }

  const updateBenefit = (planId: string, index: number, value: string) => {
    setSettings((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) =>
        plan.id === planId
          ? { ...plan, benefits: plan.benefits.map((item, i) => (i === index ? value : item)) }
          : plan
      ),
    }))
  }

  const addBenefit = (planId: string) => {
    setSettings((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) =>
        plan.id === planId ? { ...plan, benefits: [...plan.benefits, ""] } : plan
      ),
    }))
  }

  const removeBenefit = (planId: string, index: number) => {
    setSettings((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) =>
        plan.id === planId
          ? { ...plan, benefits: plan.benefits.filter((_, i) => i !== index) }
          : plan
      ),
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/membership/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setSettings(data.settings)
      toast.success("Membership setup saved")
    } catch (error: any) {
      toast.error("Save failed", { description: error.message })
    } finally {
      setSaving(false)
    }
  }

  const uploadCertificate = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/membership/settings/certificate", { method: "POST", body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setSettings(data.settings)
      toast.success("Certificate template uploaded")
    } catch (error: any) {
      toast.error("Upload failed", { description: error.message })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D47E]" />
      </div>
    )
  }

  return (
    <div className="dot-grid-bg -mx-6 -mt-2 space-y-6 rounded-[28px] px-4 py-6 sm:px-6" style={typeStyle}>
      <div className="flex flex-col gap-5 rounded-[28px] border border-[#E8EAEB] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF9F1] text-[#16a35c]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D959D]">Membership studio</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#1E1E1E] sm:text-3xl">Membership Setup</h1>
            <p className="mt-1 max-w-xl text-sm text-[#8D959D]">
              Set prices, benefits, and the certificate members receive after approval.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E8EAEB] bg-white px-4 py-2.5 text-sm font-medium text-[#1E1E1E] transition-colors hover:bg-[#F7FBF8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#00D47E] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-95 disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save setup
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FeeCard
          icon={IdCard}
          iconClass="bg-[#EEF4FF] text-[#2563EB]"
          title="Physical ID fee"
          hint="Printed membership card"
          value={settings.physicalIdFee}
          onChange={(value) => setSettings((prev) => ({ ...prev, physicalIdFee: value }))}
        />
        <FeeCard
          icon={Truck}
          iconClass="bg-[#FFF4E8] text-[#D97706]"
          title="Shipping fee"
          hint="Delivery of the physical ID"
          value={settings.shippingFee}
          onChange={(value) => setSettings((prev) => ({ ...prev, shippingFee: value }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {settings.plans.map((plan) => {
          const theme = planThemes[plan.id]
          const Icon = theme.icon
          return (
            <section
              key={plan.id}
              className="flex flex-col rounded-[24px] border border-[#E8EAEB] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: theme.soft, color: theme.accent }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: theme.soft, color: theme.ink }}
                >
                  {theme.label}
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#8D959D]">Plan name</Label>
                  <Input className={fieldClass} value={plan.name} onChange={(e) => updatePlan(plan.id, { name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#8D959D]">Price per year</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8D959D]">₱</span>
                    <Input
                      type="number"
                      min={0}
                      className={`${fieldClass} pl-8`}
                      value={plan.price}
                      onChange={(e) => updatePlan(plan.id, { price: Number(e.target.value) })}
                    />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: theme.ink }}>
                    {formatPeso(plan.price)} / year
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                  <Label className="text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Benefits</Label>
                </div>
                {plan.benefits.map((benefit, index) => (
                  <div key={`${plan.id}-${index}`} className="flex gap-2">
                    <Input
                      value={benefit}
                      placeholder="Benefit"
                      className={fieldClass}
                      onChange={(e) => updateBenefit(plan.id, index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeBenefit(plan.id, index)}
                      aria-label="Remove benefit"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E8EAEB] text-[#8D959D] hover:bg-[#FFF5F5] hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addBenefit(plan.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E8EAEB] px-3 py-1.5 text-xs font-medium text-[#1E1E1E] hover:bg-[#F7FBF8]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add benefit
                </button>
              </div>
            </section>
          )
        })}
      </div>

      <section className="grid gap-4 rounded-[28px] border border-[#E8EAEB] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EEFF] text-[#7C3AED]">
              <Award className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D959D]">Issued after approval</p>
              <h2 className="text-lg font-semibold text-[#1E1E1E]">Certificate of Membership</h2>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#8D959D]">Certificate title</Label>
            <Input
              className={fieldClass}
              value={settings.certificate.title}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  certificate: { ...prev.certificate, title: e.target.value },
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#8D959D]">Certificate text</Label>
            <Textarea
              value={settings.certificate.body}
              rows={4}
              className="rounded-xl border-[#E8EAEB] bg-white text-sm text-[#1E1E1E] shadow-none focus-visible:border-[#00D47E] focus-visible:ring-[#00D47E]/20"
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  certificate: { ...prev.certificate, body: e.target.value },
                }))
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#8D959D]">Signatory name</Label>
              <Input
                className={fieldClass}
                value={settings.certificate.signatoryName}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    certificate: { ...prev.certificate, signatoryName: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#8D959D]">Signatory title</Label>
              <Input
                className={fieldClass}
                value={settings.certificate.signatoryTitle}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    certificate: { ...prev.certificate, signatoryTitle: e.target.value },
                  }))
                }
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#CDEEDD] bg-[#F7FBF8] px-4 py-5 text-sm font-medium text-[#16a35c] transition hover:bg-[#EAF9F1]">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload certificate image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadCertificate(file)
                e.target.value = ""
              }}
            />
          </label>
        </div>

        <div className="flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-[24px] border border-[#E8EAEB] bg-[#F7FBF8] p-6 text-center">
          {settings.certificate.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.certificate.imageUrl} alt="Certificate template" className="max-h-[360px] w-full object-contain" />
          ) : (
            <>
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#7C3AED] shadow-sm">
                <Award className="h-6 w-6" />
              </span>
              <p className="text-lg font-semibold text-[#1E1E1E]">{settings.certificate.title}</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-[#8D959D]">{settings.certificate.body}</p>
              <div className="mt-6 h-px w-16 bg-[#00D47E]" />
              <p className="mt-3 text-sm font-semibold text-[#1E1E1E]">
                {settings.certificate.signatoryName || "Signatory name"}
              </p>
              <p className="text-xs text-[#8D959D]">{settings.certificate.signatoryTitle}</p>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function FeeCard({
  icon: Icon,
  iconClass,
  title,
  hint,
  value,
  onChange,
}: {
  icon: ComponentType<{ className?: string }>
  iconClass: string
  title: string
  hint: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <section className="rounded-[24px] border border-[#E8EAEB] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[#1E1E1E]">{title}</h2>
          <p className="text-xs text-[#8D959D]">{hint}</p>
        </div>
      </div>
      <Label className="text-xs font-medium text-[#8D959D]">Amount (₱)</Label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8D959D]">₱</span>
        <Input
          type="number"
          min={0}
          className={`${fieldClass} pl-8`}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </section>
  )
}
