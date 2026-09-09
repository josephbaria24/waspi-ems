export type MembershipPlanId = "standard" | "premium" | "elite"

export type MembershipPlan = {
  id: MembershipPlanId
  name: string
  price: number
  benefits: string[]
}

export type MembershipCertificate = {
  title: string
  body: string
  signatoryName: string
  signatoryTitle: string
  imageUrl: string
}

export type MembershipSettings = {
  plans: MembershipPlan[]
  physicalIdFee: number
  shippingFee: number
  certificate: MembershipCertificate
}

export const DEFAULT_MEMBERSHIP_SETTINGS: MembershipSettings = {
  plans: [
    {
      id: "standard",
      name: "Student Member",
      price: 100,
      benefits: [
        "Access to member portal",
        "Digital membership card",
        "Monthly newsletter",
        "Exclusive events and offers",
      ],
    },
    {
      id: "premium",
      name: "Professional Member",
      price: 150,
      benefits: [
        "All of student member benefits",
        "Priority customer support",
        "Exclusive discounts",
      ],
    },
    {
      id: "elite",
      name: "Organizational Member",
      price: 300,
      benefits: [
        "All of professional member benefits",
        "VIP event access",
        "Personal account manager",
        "Early access to new features",
      ],
    },
  ],
  physicalIdFee: 150,
  shippingFee: 100,
  certificate: {
    title: "Certificate of Membership",
    body: "This certifies that the named member is a registered member of WASPI in good standing.",
    signatoryName: "",
    signatoryTitle: "President, WASPI",
    imageUrl: "",
  },
}

export function formatPeso(amount: number) {
  return `₱${Number(amount || 0).toFixed(2)}`
}

export function normalizeMembershipSettings(input: unknown): MembershipSettings {
  const source = (input && typeof input === "object" ? input : {}) as Partial<MembershipSettings>
  const plans = DEFAULT_MEMBERSHIP_SETTINGS.plans.map((fallback) => {
    const incoming = Array.isArray(source.plans)
      ? source.plans.find((plan) => plan?.id === fallback.id)
      : undefined

    const benefits = Array.isArray(incoming?.benefits)
      ? incoming.benefits.map((item) => String(item).trim()).filter(Boolean)
      : fallback.benefits

    return {
      id: fallback.id,
      name: String(incoming?.name || fallback.name).trim() || fallback.name,
      price: Number.isFinite(Number(incoming?.price)) ? Math.max(0, Number(incoming?.price)) : fallback.price,
      benefits: benefits.length ? benefits : fallback.benefits,
    }
  })

  return {
    plans,
    physicalIdFee: Number.isFinite(Number(source.physicalIdFee))
      ? Math.max(0, Number(source.physicalIdFee))
      : DEFAULT_MEMBERSHIP_SETTINGS.physicalIdFee,
    shippingFee: Number.isFinite(Number(source.shippingFee))
      ? Math.max(0, Number(source.shippingFee))
      : DEFAULT_MEMBERSHIP_SETTINGS.shippingFee,
    certificate: {
      title: String(source.certificate?.title || DEFAULT_MEMBERSHIP_SETTINGS.certificate.title).trim(),
      body: String(source.certificate?.body || DEFAULT_MEMBERSHIP_SETTINGS.certificate.body).trim(),
      signatoryName: String(source.certificate?.signatoryName || "").trim(),
      signatoryTitle: String(source.certificate?.signatoryTitle || DEFAULT_MEMBERSHIP_SETTINGS.certificate.signatoryTitle).trim(),
      imageUrl: String(source.certificate?.imageUrl || "").trim(),
    },
  }
}

export function getPlan(settings: MembershipSettings, id: string) {
  return settings.plans.find((plan) => plan.id === id) || settings.plans[0]
}
