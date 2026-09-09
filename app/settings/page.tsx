"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Database, Download, KeyRound, Loader2, Plus, Shield, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase-client"

const ROLES = ["Admin", "Organizer", "Staff"] as const

type Account = {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  lastSignInAt: string | null
}

const fieldClass =
  "h-11 rounded-xl border-[#E8EAEB] bg-white text-sm text-[#1E1E1E] shadow-none focus-visible:border-[#00D47E] focus-visible:ring-[#00D47E]/20"

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("Please log in again.")
  return { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currentUserId, setCurrentUserId] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [newAccount, setNewAccount] = useState({ name: "", email: "", password: "", role: "Staff" })
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState("")

  const loadAccounts = async () => {
    const headers = await authHeaders()
    const response = await fetch("/api/settings/users", { headers })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || "Failed to load accounts")
    setAccounts(payload.users || [])
    setCurrentUserId(payload.currentUserId || "")
  }

  useEffect(() => {
    const start = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace("/login?redirect=/settings")
        return
      }
      try {
        await loadAccounts()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    start()
  }, [router])

  const current = accounts.find((account) => account.id === currentUserId)

  const changeOwnPassword = async () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSavingPassword(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setPassword("")
    setConfirmPassword("")
    toast.success("Password updated")
  }

  const createAccount = async () => {
    setCreating(true)
    try {
      const headers = await authHeaders()
      const response = await fetch("/api/settings/users", {
        method: "POST",
        headers,
        body: JSON.stringify(newAccount),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Failed to add account")
      setNewAccount({ name: "", email: "", password: "", role: "Staff" })
      await loadAccounts()
      toast.success("Account added")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add account")
    } finally {
      setCreating(false)
    }
  }

  const updateAccount = async (account: Account, changes: { role?: string; password?: string; name?: string }) => {
    setBusyId(account.id)
    try {
      const headers = await authHeaders()
      const response = await fetch("/api/settings/users", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id: account.id, ...changes }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Failed to update account")
      await loadAccounts()
      toast.success("Account updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update account")
    } finally {
      setBusyId("")
    }
  }

  const deleteAccount = async (account: Account) => {
    if (!window.confirm(`Delete ${account.email}? This cannot be undone.`)) return
    setBusyId(account.id)
    try {
      const headers = await authHeaders()
      const response = await fetch(`/api/settings/users?id=${account.id}`, { method: "DELETE", headers })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Failed to delete account")
      await loadAccounts()
      toast.success("Account deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account")
    } finally {
      setBusyId("")
    }
  }

  const download = async (type: "events" | "attendees" | "members" | "backup") => {
    try {
      const headers = await authHeaders()
      const response = await fetch(`/api/settings/export?type=${type}`, { headers })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Download failed")
      }
      const blob = await response.blob()
      const filename = response.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || `waspi-${type}`
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      toast.success(type === "backup" ? "Backup downloaded" : "Export downloaded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7FBF8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8D959D]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7FBF8]">
      <Navigation />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0B1F14]">Settings</h1>
          <p className="mt-1 text-sm text-[#8D959D]">Manage accounts, roles, and data exports.</p>
        </div>

        <Card className="rounded-2xl border border-[#E8EAEB] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E1E1E]">
              <KeyRound className="h-5 w-5 text-[#017C7C]" />
              Change password
            </CardTitle>
            <CardDescription className="text-[#8D959D]">
              Signed in as {current?.email || "your account"}{current?.role ? ` · ${current.role}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className={fieldClass} />
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className={fieldClass} />
            <Button onClick={changeOwnPassword} disabled={savingPassword} className="h-11 rounded-full bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]">
              {savingPassword ? "Saving..." : "Update password"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#E8EAEB] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E1E1E]">
              <UserPlus className="h-5 w-5 text-[#017C7C]" />
              Add account
            </CardTitle>
            <CardDescription className="text-[#8D959D]">Create another login and assign a role.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Input value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} placeholder="Full name" className={fieldClass} />
            <Input type="email" value={newAccount.email} onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })} placeholder="Email" className={fieldClass} />
            <Input type="password" value={newAccount.password} onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })} placeholder="Temporary password" className={fieldClass} />
            <select
              value={newAccount.role}
              onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
              className={fieldClass}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <Button onClick={createAccount} disabled={creating} className="h-11 rounded-full bg-[#0B1F14] text-white hover:bg-[#0B1F14]/90 sm:col-span-2">
              <Plus className="h-4 w-4" />
              {creating ? "Adding..." : "Add account"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#E8EAEB] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E1E1E]">
              <Shield className="h-5 w-5 text-[#017C7C]" />
              Accounts
            </CardTitle>
            <CardDescription className="text-[#8D959D]">Change a role or set a new password for an existing login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                isCurrent={account.id === currentUserId}
                busy={busyId === account.id}
                onSave={(changes) => updateAccount(account, changes)}
                onDelete={() => deleteAccount(account)}
              />
            ))}
            {accounts.length === 0 && <p className="text-sm text-[#8D959D]">No accounts found.</p>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#E8EAEB] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E1E1E]">
              <Database className="h-5 w-5 text-[#017C7C]" />
              Export and backup
            </CardTitle>
            <CardDescription className="text-[#8D959D]">Download CSV exports or a full JSON backup of events, attendees, and membership data.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => download("events")} className="rounded-full border-[#E8EAEB]">
              <Download className="h-4 w-4" />
              Export events
            </Button>
            <Button variant="outline" onClick={() => download("attendees")} className="rounded-full border-[#E8EAEB]">
              <Download className="h-4 w-4" />
              Export attendees
            </Button>
            <Button variant="outline" onClick={() => download("members")} className="rounded-full border-[#E8EAEB]">
              <Download className="h-4 w-4" />
              Export members
            </Button>
            <Button onClick={() => download("backup")} className="rounded-full bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]">
              <Database className="h-4 w-4" />
              Backup data
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function AccountRow({
  account,
  isCurrent,
  busy,
  onSave,
  onDelete,
}: {
  account: Account
  isCurrent: boolean
  busy: boolean
  onSave: (changes: { role?: string; password?: string; name?: string }) => void
  onDelete: () => void
}) {
  const [role, setRole] = useState(account.role)
  const [nextPassword, setNextPassword] = useState("")

  useEffect(() => {
    setRole(account.role)
  }, [account.role])

  return (
    <div className="grid gap-3 rounded-2xl border border-[#E8EAEB] bg-[#F7FBF8] p-3 sm:grid-cols-[1.4fr_140px_1fr_auto]">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#1E1E1E]">{account.name || account.email}</p>
        <p className="truncate text-xs text-[#8D959D]">{account.email}{isCurrent ? " · You" : ""}</p>
      </div>
      <select value={role} onChange={(e) => setRole(e.target.value)} className={fieldClass} disabled={busy}>
        {ROLES.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      <Input
        type="password"
        value={nextPassword}
        onChange={(e) => setNextPassword(e.target.value)}
        placeholder="New password"
        className={fieldClass}
        disabled={busy}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={busy}
          onClick={() => {
            onSave({ role, password: nextPassword || undefined })
            setNextPassword("")
          }}
          className="h-11 rounded-full bg-[#00D47E] px-4 font-semibold text-[#0B1F14] hover:bg-[#00c174]"
        >
          Save
        </Button>
        {!isCurrent && (
          <Button type="button" variant="outline" disabled={busy} onClick={onDelete} className="h-11 rounded-full border-red-200 text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
