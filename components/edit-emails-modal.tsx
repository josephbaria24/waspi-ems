"use client"

import { useEffect, useMemo, useState } from "react"
import {
  GripVertical,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Eye,
  Type,
  AlignLeft,
  MousePointerClick,
  Minus,
  Info,
  ImageIcon,
  QrCode,
  TextQuote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  EMAIL_VARIABLES,
  createDefaultEmailTemplates,
  fillTemplate,
  newEmailBlock,
  normalizeEmailTemplatesConfig,
  renderEmailTemplate,
  type EmailBlock,
  type EmailBlockType,
  type EmailTemplateKey,
  type EmailTemplatesConfig,
} from "@/lib/email-templates"
import { formatAgendaHtml } from "@/lib/event-agenda"

type Props = {
  eventId: number
  eventName: string
  open: boolean
  onClose: () => void
}

const BLOCK_TOOLS: { type: EmailBlockType; label: string; icon: typeof Type }[] = [
  { type: "heading", label: "Heading", icon: Type },
  { type: "paragraph", label: "Text", icon: AlignLeft },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "info", label: "Info box", icon: Info },
  { type: "logo", label: "Logo", icon: ImageIcon },
  { type: "qr", label: "QR", icon: QrCode },
  { type: "footer", label: "Footer", icon: TextQuote },
]

function reorder<T>(list: T[], from: number, to: number) {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export default function EditEmailsModal({ eventId, eventName, open, onClose }: Props) {
  const [config, setConfig] = useState<EmailTemplatesConfig>(createDefaultEmailTemplates())
  const [selectedKey, setSelectedKey] = useState<EmailTemplateKey>("registration_confirmation")
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [warning, setWarning] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [dragEmailKey, setDragEmailKey] = useState<EmailTemplateKey | null>(null)
  const [dragBlockId, setDragBlockId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const load = async () => {
      setLoading(true)
      setWarning("")
      try {
        const res = await fetch(`/api/events/email-templates?eventId=${eventId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load")
        const next = normalizeEmailTemplatesConfig(data.config)
        setConfig(next)
        setSelectedKey(next.order[0] || "registration_confirmation")
        if (data.warning) setWarning(data.warning)
        setCoverImage(typeof data.featureImage === "string" ? data.featureImage : "")
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to load email templates")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open, eventId])

  const selected = config.templates[selectedKey]
  const selectedBlock = selected?.blocks.find((b) => b.id === selectedBlockId) || null

  const preview = useMemo(() => {
    if (!selected) return { subject: "", html: "" }
    return renderEmailTemplate(
      selected,
      {
        name: "Jane Doe",
        first_name: "Jane",
        event_name: eventName || "Sample Event",
        venue: "Sample Venue",
        reference_id: "WASPI-DEMO-001",
        link: "https://waspi.ph/demo",
        eval_link: "https://waspi.ph/evaluation/demo",
        certificate_label: "Participation",
        agenda: formatAgendaHtml([
          { date: "2026-12-02", timeIn: "13:00", timeOut: "17:00", coveredTopics: ["HSE"] },
          { date: "2026-12-03", timeIn: "08:00", timeOut: "17:00", coveredTopics: [] },
        ]),
      },
      { preview: true, bannerSrc: coverImage || undefined },
    )
  }, [selected, eventName, coverImage])

  const updateSelected = (patch: Partial<typeof selected>) => {
    setConfig((prev) => ({
      ...prev,
      templates: {
        ...prev.templates,
        [selectedKey]: { ...prev.templates[selectedKey], ...patch },
      },
    }))
  }

  const updateBlock = (blockId: string, patch: Partial<EmailBlock>) => {
    updateSelected({
      blocks: selected.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
    })
  }

  const removeBlock = (blockId: string) => {
    updateSelected({ blocks: selected.blocks.filter((b) => b.id !== blockId) })
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }

  const addBlock = (type: EmailBlockType) => {
    const next = newEmailBlock(type)
    updateSelected({ blocks: [...selected.blocks, next] })
    setSelectedBlockId(next.id)
  }

  const insertVariable = (key: string) => {
    const token = `{{${key}}}`
    if (!selectedBlock) {
      updateSelected({ subject: `${selected.subject} ${token}`.trim() })
      return
    }
    if (selectedBlock.type === "button") {
      updateBlock(selectedBlock.id, { label: `${selectedBlock.label || ""} ${token}`.trim() })
      return
    }
    updateBlock(selectedBlock.id, { text: `${selectedBlock.text || ""}${token}` })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/events/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, config }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      setConfig(normalizeEmailTemplatesConfig(data.config))
      alert("Email templates saved")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const resetSelected = () => {
    const defaults = createDefaultEmailTemplates()
    updateSelected(defaults.templates[selectedKey])
    setSelectedBlockId(null)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex h-[92vh] w-[96vw] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b border-[#E8EAEB] px-6 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-[#0B1F14]">
            <Mail className="h-5 w-5 text-[#017C7C]" />
            Edit event emails
          </DialogTitle>
          <DialogDescription>
            Manage confirmation, evaluation, certificate, and admin emails. Drag to reorder. Use the personal detail
            buttons to insert names, event info, and links.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[#8D959D]">Loading templates…</div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)]">
            {/* Email list */}
            <aside className="min-h-0 overflow-y-auto border-b border-[#E8EAEB] lg:border-b-0 lg:border-r">
              <div className="space-y-2 p-3">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">
                  Emails · drag to reorder
                </p>
                {config.order.map((key, index) => {
                  const item = config.templates[key]
                  const active = key === selectedKey
                  return (
                    <button
                      key={key}
                      type="button"
                      draggable
                      onDragStart={() => setDragEmailKey(key)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (!dragEmailKey || dragEmailKey === key) return
                        const from = config.order.indexOf(dragEmailKey)
                        setConfig((prev) => ({ ...prev, order: reorder(prev.order, from, index) }))
                        setDragEmailKey(null)
                      }}
                      onClick={() => {
                        setSelectedKey(key)
                        setSelectedBlockId(null)
                      }}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-[#00D47E] bg-[#00D47E]/10"
                          : "border-[#E8EAEB] bg-white hover:bg-[#F7FBF8]"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#8D959D]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-[#0B1F14]">{item.name}</p>
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${item.enabled ? "bg-[#00D47E]" : "bg-[#C5CAD0]"}`}
                            />
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-[#8D959D]">{item.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </aside>

            {/* Editor */}
            <section className="min-h-0 overflow-y-auto border-b border-[#E8EAEB] p-4 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#0B1F14]">{selected.name}</h3>
                  <p className="text-xs text-[#8D959D]">{selected.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="enabled" className="text-xs text-[#8D959D]">
                    Enabled
                  </Label>
                  <Switch
                    id="enabled"
                    checked={selected.enabled}
                    onCheckedChange={(checked) => updateSelected({ enabled: checked })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-[#8D959D]">Subject</Label>
                  <Input
                    value={selected.subject}
                    onChange={(e) => updateSelected({ subject: e.target.value })}
                    className="mt-1 rounded-xl border-[#E8EAEB]"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-[#8D959D]">From name</Label>
                  <Input
                    value={selected.fromName}
                    onChange={(e) => updateSelected({ fromName: e.target.value })}
                    className="mt-1 rounded-xl border-[#E8EAEB]"
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8D959D]">Add block</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BLOCK_TOOLS.map((tool) => {
                      const Icon = tool.icon
                      return (
                        <Button
                          key={tool.type}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg border-[#E8EAEB] px-2.5 text-xs"
                          onClick={() => addBlock(tool.type)}
                        >
                          <Icon className="mr-1 h-3.5 w-3.5" />
                          {tool.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                    Insert personal details
                  </p>
                  <p className="mb-2 text-[11px] text-[#8D959D]">
                    Click to add a placeholder — it will be filled automatically when the email is sent.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {EMAIL_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        className="rounded-md border border-[#017C7C]/25 bg-[#E8F5F5] px-2.5 py-1.5 text-xs font-medium text-[#017C7C] hover:bg-[#d7eeee]"
                        title={`Adds ${v.label.toLowerCase()} automatically when sent`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                    Content blocks · drag to reorder
                  </p>
                  {selected.blocks.map((block, index) => {
                    const active = block.id === selectedBlockId
                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={() => setDragBlockId(block.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (!dragBlockId || dragBlockId === block.id) return
                          const from = selected.blocks.findIndex((b) => b.id === dragBlockId)
                          updateSelected({ blocks: reorder(selected.blocks, from, index) })
                          setDragBlockId(null)
                        }}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`rounded-xl border p-3 ${
                          active ? "border-[#00D47E] bg-[#F7FBF8]" : "border-[#E8EAEB] bg-white"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8D959D]">
                            <GripVertical className="h-4 w-4" />
                            {block.type}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeBlock(block.id)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {block.type === "button" ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                              value={block.label || ""}
                              onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                              placeholder="Button label"
                              className="rounded-lg"
                            />
                            <Input
                              value={block.url || ""}
                              onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                              placeholder="Button URL / {{link}}"
                              className="rounded-lg"
                            />
                          </div>
                        ) : block.type === "logo" || block.type === "qr" || block.type === "divider" ? (
                          <p className="text-xs text-[#8D959D]">
                            {block.type === "logo"
                              ? "WASPI logo block"
                              : block.type === "qr"
                                ? "QR code is generated when the email is sent"
                                : "Horizontal divider"}
                          </p>
                        ) : (
                          <Textarea
                            value={block.text || ""}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                            className="min-h-[72px] rounded-lg text-sm"
                          />
                        )}
                      </div>
                    )
                  })}
                  {selected.blocks.length === 0 && (
                    <button
                      type="button"
                      onClick={() => addBlock("paragraph")}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#CDEEDD] bg-[#F7FBF8] px-4 py-8 text-sm text-[#8D959D]"
                    >
                      <Plus className="h-4 w-4" />
                      Add your first block
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Preview */}
            <section className="min-h-0 overflow-y-auto bg-[#F7FBF8] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0B1F14]">
                <Eye className="h-4 w-4 text-[#017C7C]" />
                Live preview
              </div>
              <div className="rounded-xl border border-[#E8EAEB] bg-white p-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">Subject</p>
                <p className="mt-1 text-sm font-semibold text-[#0B1F14]">{preview.subject}</p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#8D959D]">From</p>
                <p className="mt-1 text-sm text-[#1E1E1E]">
                  {fillTemplate(selected.fromName, { event_name: eventName })} &lt;no-reply@waspi.ph&gt;
                </p>
              </div>
              <div
                className="mt-3 overflow-hidden rounded-xl border border-[#E8EAEB] bg-white"
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            </section>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-[#E8EAEB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {warning ? (
              <p className="text-xs text-amber-700">{warning}</p>
            ) : (
              <p className="text-xs text-[#8D959D]">
                Changes apply the next time these emails are sent for this event.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={resetSelected}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset this email
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="rounded-xl bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save emails"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
