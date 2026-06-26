"use client"

import { useEffect, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Loader2, Save, User, MapPin, Briefcase, Link2, ExternalLink } from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

type Profile = {
  id: string
  email: string
  name?: string
  username?: string
  headline?: string
  location?: string
  bio?: string
  linkedinUrl?: string
  githubUrl?: string
  targetRole?: string
  targetSalaryMin?: number
  targetSalaryMax?: number
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}{label}
      </label>
      {children}
    </div>
  )
}

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"

export default function ProfilePage() {
  const { currency } = useCurrency()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setForm(data)
      })
      .finally(() => setLoading(false))
  }, [])

  function set(key: keyof Profile, value: any) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    // Salary validation
    if (form.targetSalaryMin && form.targetSalaryMax && form.targetSalaryMin >= form.targetSalaryMax) {
      setError("Min salary must be less than max salary")
      return
    }
    setSaving(true)
    setError(null)
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Failed to save")
    } else {
      setProfile(data)
      setForm(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const initials = (form.name ?? form.email ?? "?").slice(0, 2).toUpperCase()

  return (
    <main className="min-h-svh bg-background">
      <AppHeader />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{form.name ?? "Your Profile"}</h2>
            <p className="text-sm text-muted-foreground">{form.email}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            {/* Basic info */}
            <section className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><User className="size-4" />Basic Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" icon={<User className="size-3" />}>
                  <input value={form.name ?? ""} onChange={e => set("name", e.target.value)} placeholder="Jane Smith" className={inputClass} />
                </Field>
                <Field label="Username">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                    <input value={form.username ?? ""} onChange={e => set("username", e.target.value)} placeholder="janesmith" className={`${inputClass} pl-7`} />
                  </div>
                </Field>
                <div className="col-span-2">
                  <Field label="Headline">
                    <input value={form.headline ?? ""} onChange={e => set("headline", e.target.value)} placeholder="Senior Software Engineer · 5 YOE · Open to work" className={inputClass} />
                  </Field>
                </div>
                <Field label="Location" icon={<MapPin className="size-3" />}>
                  <input value={form.location ?? ""} onChange={e => set("location", e.target.value)} placeholder="San Francisco, CA" className={inputClass} />
                </Field>
                <Field label="Email">
                  <input value={form.email ?? ""} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
                </Field>
                <div className="col-span-2">
                  <Field label="Bio">
                    <textarea value={form.bio ?? ""} onChange={e => set("bio", e.target.value)} rows={3} placeholder="A brief description about yourself…" className={`${inputClass} resize-none`} />
                  </Field>
                </div>
              </div>
            </section>

            {/* Job search preferences */}
            <section className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Briefcase className="size-4" />Job Search Preferences</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="Target Role">
                    <input value={form.targetRole ?? ""} onChange={e => set("targetRole", e.target.value)} placeholder="Staff Engineer, Engineering Manager…" className={inputClass} />
                  </Field>
                </div>
                <Field label={`Target Salary Min (${currency.symbol})`} icon={<span className="text-xs text-muted-foreground">{currency.symbol}</span>}>
                  <input type="number" value={form.targetSalaryMin ?? ""} onChange={e => set("targetSalaryMin", parseInt(e.target.value) || undefined)} placeholder="e.g. 1500000" className={inputClass} />
                </Field>
                <Field label={`Target Salary Max (${currency.symbol})`} icon={<span className="text-xs text-muted-foreground">{currency.symbol}</span>}>
                  <input type="number" value={form.targetSalaryMax ?? ""} onChange={e => set("targetSalaryMax", parseInt(e.target.value) || undefined)} placeholder="e.g. 2500000" className={inputClass} />
                </Field>
              </div>
            </section>

            {/* Links */}
            <section className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Link2 className="size-4" />Links</h3>
              <div className="grid gap-4">
                <Field label="LinkedIn URL" icon={<ExternalLink className="size-3" />}>
                  <input type="url" value={form.linkedinUrl ?? ""} onChange={e => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/username" className={inputClass} />
                </Field>
                <Field label="GitHub URL" icon={<ExternalLink className="size-3" />}>
                  <input type="url" value={form.githubUrl ?? ""} onChange={e => set("githubUrl", e.target.value)} placeholder="https://github.com/username" className={inputClass} />
                </Field>
              </div>
            </section>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saved ? "Saved!" : saving ? "Saving…" : "Save Profile"}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
