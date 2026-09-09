import { promises as fs } from "fs"
import path from "path"
import { supabaseServer } from "@/lib/supabase-server"
import {
  DEFAULT_MEMBERSHIP_SETTINGS,
  MembershipSettings,
  normalizeMembershipSettings,
} from "@/lib/membership-settings"

const SETUP_ACTION = "membership_setup"
const FILE_PATH = path.join(process.cwd(), "data", "membership-settings.json")

function parseDetails(details: unknown): MembershipSettings | null {
  if (!details) return null
  if (typeof details === "string") {
    try {
      return normalizeMembershipSettings(JSON.parse(details))
    } catch {
      return null
    }
  }
  return normalizeMembershipSettings(details)
}

async function readFileSettings(): Promise<MembershipSettings | null> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8")
    return normalizeMembershipSettings(JSON.parse(raw))
  } catch {
    return null
  }
}

async function writeFileSettings(settings: MembershipSettings) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true })
  await fs.writeFile(FILE_PATH, JSON.stringify(settings, null, 2), "utf8")
}

async function readDatabaseSettings(): Promise<MembershipSettings | null> {
  const { data, error } = await supabaseServer
    .from("audit_logs")
    .select("id, details, created_at")
    .eq("action", SETUP_ACTION)
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    console.error("membership setup read failed:", error.message)
    return null
  }

  const row = Array.isArray(data) ? data[0] : null
  return row ? parseDetails(row.details) : null
}

export async function getMembershipSettings(): Promise<MembershipSettings> {
  const fromDb = await readDatabaseSettings()
  if (fromDb) return fromDb
  return (await readFileSettings()) || DEFAULT_MEMBERSHIP_SETTINGS
}

export async function saveMembershipSettings(input: unknown): Promise<MembershipSettings> {
  const settings = normalizeMembershipSettings(input)
  await writeFileSettings(settings)

  const { error } = await supabaseServer.from("audit_logs").insert({
    action: SETUP_ACTION,
    details: settings,
  })

  if (error) {
    console.error("membership setup save failed:", error.message)
    throw new Error(error.message)
  }

  return settings
}
