import { Download, FileText } from "lucide-react"

export const CONVENTION_FORMS = [
  {
    href: "/Safety%20Excellence%20Form%202026.docx",
    filename: "Safety Excellence Form 2026.docx",
    eyebrow: "Award form",
    title: "Safety Excellence Award",
    description:
      "For companies applying with a No Lost Time Accident record. List safe man-hours, employees, and safety officers, then email the completed form to the convention secretariat.",
  },
  {
    href: "/WASPI%20EXHIBITORS_FORM-2026.docx",
    filename: "WASPI EXHIBITORS_FORM-2026.docx",
    eyebrow: "Exhibitor form",
    title: "Exhibit application",
    description:
      "For suppliers booking a 3m × 3m booth at the December 2–4, 2026 Safety and Health Exhibit. The booth package is ₱20,000.",
  },
] as const

export function ConventionForms({ placement = "landing" }: { placement?: "landing" | "banner" }) {
  if (placement === "banner") {
    return (
      <div className="border-b border-[#E3EFE8] bg-[#F7FBF8] px-4 py-3 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#017C7C]">
          Downloadable forms
        </p>
        <div className="mt-2 grid gap-2">
          {CONVENTION_FORMS.map((form) => (
            <a
              key={form.href}
              href={form.href}
              download={form.filename}
              className="flex items-start gap-3 rounded-xl border border-[#D7EEE4] bg-white px-3 py-2.5 transition hover:border-[#00D47E]"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00D47E]/20 text-[#0B1F14]">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#0B1F14]">{form.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-[#5c656c]">{form.description}</span>
              </span>
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0B1F14] px-2.5 py-1 text-[11px] font-semibold text-white">
                <Download className="h-3 w-3" />
                Word
              </span>
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="px-2 pb-4 pt-2 sm:px-10 lg:px-14">
      <div className="rounded-[28px] border border-[#D7EEE4] bg-[#F7FBF8] p-5 sm:p-7">
        <p className="text-sm font-medium text-[#00A86B]">Convention forms</p>
        <h2 className="mt-2 max-w-2xl text-2xl font-semibold leading-tight text-[#0B1F14] sm:text-3xl">
          Download the award and exhibitor forms.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5c656c] sm:text-base">
          Word files you can fill out and email to info@waspi.ph or waspi.updates@gmail.com.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {CONVENTION_FORMS.map((form) => (
            <a
              key={form.href}
              href={form.href}
              download={form.filename}
              className="flex h-full flex-col rounded-2xl border border-[#E8EAEB] bg-white p-5 shadow-sm transition hover:border-[#00D47E]"
            >
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#00D47E]/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0B1F14]">
                <FileText className="h-3.5 w-3.5" />
                {form.eyebrow}
              </span>
              <span className="mt-3 text-lg font-semibold text-[#0B1F14]">{form.title}</span>
              <span className="mt-2 flex-1 text-sm leading-6 text-[#5c656c]">{form.description}</span>
              <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#0B1F14] px-4 py-2 text-sm font-semibold text-white">
                <Download className="h-4 w-4" />
                Download Word file
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
