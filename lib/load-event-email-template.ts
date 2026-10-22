import {
  createDefaultEmailTemplates,
  normalizeEmailTemplatesConfig,
  type EmailTemplate,
  type EmailTemplateKey,
} from "@/lib/email-templates"
import { supabaseServer } from "@/lib/supabase-server"

export async function loadEventEmailTemplate(
  eventId: number,
  key: EmailTemplateKey,
): Promise<EmailTemplate> {
  const defaults = createDefaultEmailTemplates()

  const { data, error } = await supabaseServer
    .from("events")
    .select("email_templates")
    .eq("id", eventId)
    .maybeSingle()

  if (error || !data) {
    return defaults.templates[key]
  }

  const config = normalizeEmailTemplatesConfig(data.email_templates)
  return config.templates[key] || defaults.templates[key]
}
