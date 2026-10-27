import { emailStatusTags, type EmailStatus } from "@/lib/email-status"

export function EmailStatusTags({
  status,
  evaluated,
}: {
  status?: EmailStatus | null
  evaluated?: boolean
}) {
  const tags = emailStatusTags(status, evaluated)
  if (!tags.length) return null

  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag.key}
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold leading-4 ${tag.className}`}
        >
          {tag.label}
        </span>
      ))}
    </span>
  )
}
