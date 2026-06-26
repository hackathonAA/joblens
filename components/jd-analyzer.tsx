"use client"

import { useState, useEffect } from "react"
import { Sparkles, Loader2, CheckCircle, AlertTriangle, Info, Link2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

type JDResult = {
  requiredSkills: string[]
  niceToHaveSkills: string[]
  senioritySignals: string[]
  redFlags: string[]
  salarySignals: string
  techStack: string[]
  fitScore: number
  fitReason: string
}

type AppOption = { id: string; company: string; role: string }

function fitColor(score: number) {
  if (score >= 75) return "text-emerald-400"
  if (score >= 50) return "text-yellow-400"
  return "text-red-400"
}

function fitBg(score: number) {
  if (score >= 75) return "border-emerald-500/30 bg-emerald-500/10"
  if (score >= 50) return "border-yellow-500/30 bg-yellow-500/10"
  return "border-red-500/30 bg-red-500/10"
}

function fitLabel(score: number) {
  if (score >= 75) return "Strong fit"
  if (score >= 50) return "Partial fit"
  return "Weak fit"
}

function Chip({ label, variant }: { label: string; variant: "green" | "yellow" | "red" | "blue" | "muted" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
      variant === "green" && "bg-emerald-500/15 text-emerald-400",
      variant === "yellow" && "bg-yellow-500/15 text-yellow-400",
      variant === "red" && "bg-red-500/15 text-red-400",
      variant === "blue" && "bg-primary/15 text-primary",
      variant === "muted" && "bg-secondary text-muted-foreground",
    )}>
      {label}
    </span>
  )
}

export function JdAnalyzer() {
  const searchParams = useSearchParams()
  const preselectedAppId = searchParams.get("appId")

  const [jd, setJd] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<JDResult | null>(null)
  const [apps, setApps] = useState<AppOption[]>([])
  const [linkedAppId, setLinkedAppId] = useState(preselectedAppId ?? "")
  const [saved, setSaved] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [profileComplete, setProfileComplete] = useState(true)
  const [missingFields, setMissingFields] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/applications")
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        if (Array.isArray(data)) setApps(data.map(a => ({ id: a.id, company: a.company, role: a.role })))
      })
      .catch(() => {})
    fetch("/api/profile")
      .then(r => r.ok ? r.json() : null)
      .then((profile: any) => {
        if (!profile) return
        const missing: string[] = []
        if (!profile.headline) missing.push("headline")
        if (!profile.bio) missing.push("bio")
        if (!profile.targetRole) missing.push("target role")
        if (!profile.targetSalaryMin) missing.push("salary expectations")
        setMissingFields(missing)
        setProfileComplete(missing.length === 0)
      })
      .catch(() => {})
  }, [])

  async function analyze() {
    if (!jd.trim() || loading) return
    setLoading(true)
    setResult(null)
    setSaved(false)
    try {
      const res = await fetch("/api/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd: jd.trim(), applicationId: linkedAppId || undefined }),
      })
      if (!res.ok) throw new Error("Analysis failed")
      const data = await res.json()
      setResult(data)
      if (linkedAppId) setSaved(true)
    } catch {
      // silent — user can retry
    } finally {
      setLoading(false)
    }
  }

  async function saveToApp() {
    if (!result || !linkedAppId) return
    await fetch("/api/analyze-jd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd: jd.trim(), applicationId: linkedAppId }),
    })
    setSaved(true)
  }

  return (
    <div className="px-8 py-7">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">JD Analyzer</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Paste a job description to extract skills, red flags, and your fit score.</p>
      </div>

      <div className="mx-auto max-w-4xl flex flex-col gap-6">

        {/* Profile completeness nudge */}
        {!profileComplete && missingFields.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
            <Info className="size-4 text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">Complete your profile for a better fit score</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Missing: <span className="font-medium text-yellow-400">{missingFields.join(", ")}</span>
                {" — "}
                <a href="/profile" className="text-primary hover:underline">Update profile →</a>
              </p>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job Description</p>
          <textarea
            value={jd}
            onChange={e => { setJd(e.target.value); setCharCount(e.target.value.length) }}
            placeholder={"Paste the full job description here…\n\nInclude role summary, requirements, and nice-to-haves."}
            rows={10}
            className="w-full resize-none rounded-xl border border-border bg-background/60 p-4 text-[13px] leading-relaxed text-card-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-mono"
          />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 rounded-lg border border-border bg-background/40 px-3 py-2">
              <Link2 className="size-3.5 text-muted-foreground shrink-0" />
              <select
                value={linkedAppId}
                onChange={e => setLinkedAppId(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground outline-none"
              >
                <option value="">Link to application (optional)</option>
                {apps.map(a => (
                  <option key={a.id} value={a.id}>{a.company} — {a.role}</option>
                ))}
              </select>
              {linkedAppId && (
                <button onClick={() => setLinkedAppId("")} className="text-muted-foreground hover:text-foreground">
                  <X className="size-3" />
                </button>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{charCount} chars</span>
            <button
              onClick={analyze}
              disabled={loading || !jd.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {loading ? "Analyzing…" : "Analyze JD"}
            </button>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center gap-3">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Amazon Nova is reading the JD…</p>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-4">
            {/* Fit Score */}
            <div className={cn("rounded-2xl border p-5", fitBg(result.fitScore))}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Fit Score</p>
                  <p className="text-xs text-muted-foreground">{fitLabel(result.fitScore)}</p>
                </div>
                <span className={cn("text-5xl font-black leading-none", fitColor(result.fitScore))}>
                  {result.fitScore}<span className="text-2xl">%</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/60 mb-3">
                <div
                  className={cn("h-full rounded-full transition-all duration-700",
                    result.fitScore >= 75 ? "bg-emerald-500" : result.fitScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${result.fitScore}%` }}
                />
              </div>
              <p className="text-[13px] text-card-foreground leading-relaxed">{result.fitReason}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">Powered by Amazon Nova</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required Skills */}
              {result.requiredSkills?.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="size-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-card-foreground">Required Skills</span>
                    <span className="text-[10px] text-muted-foreground">must-have</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.requiredSkills.map(s => <Chip key={s} label={s} variant="green" />)}
                  </div>
                </div>
              )}

              {/* Nice to Have */}
              {result.niceToHaveSkills?.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="size-3.5 text-yellow-400" />
                    <span className="text-xs font-semibold text-card-foreground">Nice to Have</span>
                    <span className="text-[10px] text-muted-foreground">bonus points</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.niceToHaveSkills.map(s => <Chip key={s} label={s} variant="yellow" />)}
                  </div>
                </div>
              )}

              {/* Tech Stack */}
              {result.techStack?.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-card-foreground mb-3">Tech Stack Mentioned</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.techStack.map(s => <Chip key={s} label={s} variant="blue" />)}
                  </div>
                </div>
              )}

              {/* Red Flags */}
              {result.redFlags?.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="size-3.5 text-red-400" />
                    <span className="text-xs font-semibold text-red-400">Red Flags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.redFlags.map(s => <Chip key={s} label={s} variant="red" />)}
                  </div>
                </div>
              )}

              {/* Seniority signals */}
              {result.senioritySignals?.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-card-foreground mb-2">Seniority Signals</p>
                  <div className="flex flex-col gap-1">
                    {result.senioritySignals.map(s => (
                      <p key={s} className="text-[12px] text-muted-foreground">· {s}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Salary signals */}
              {result.salarySignals && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-card-foreground mb-2">Salary Signals</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{result.salarySignals}</p>
                </div>
              )}
            </div>

            {/* Save to app CTA */}
            {linkedAppId && !saved && (
              <button onClick={saveToApp}
                className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5">
                <Link2 className="size-4" /> Save analysis to linked application
              </button>
            )}
            {saved && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
                <CheckCircle className="size-4" /> Analysis saved — fit score will appear on the kanban card
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
