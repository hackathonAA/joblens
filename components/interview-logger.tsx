"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, Trash2, ChevronDown } from "lucide-react"
import { OUTCOME_CONFIG } from "@/lib/interview-data"
import { cn } from "@/lib/utils"

type Question = { id: string; question: string; topicTag?: string }
type Round = {
  id: string
  applicationId: string
  roundType: string
  interviewerName?: string
  interviewerTitle?: string
  scheduledAt?: string
  outcome: string
  notes?: string
  questions: Question[]
}
type App = { id: string; company: string; role: string; level?: string; rounds: Round[] }

const ROUND_TYPES = ["Phone Screen", "Recruiter Screen", "Technical Round", "System Design", "Behavioral", "Final Round", "Onsite", "Take-Home", "Other"]
const OUTCOMES = ["pending", "passed", "failed"]

export function InterviewLogger() {
  const [apps, setApps] = useState<App[]>([])
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddRound, setShowAddRound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [roundForm, setRoundForm] = useState({ roundType: "Phone Screen", interviewerName: "", interviewerTitle: "", scheduledAt: "", notes: "" })

  useEffect(() => {
    fetch("/api/interviews")
      .then(r => r.json())
      .then((data: App[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setApps(data)
          setSelectedAppId(data[0].id)
          if (data[0].rounds.length > 0) setSelectedRoundId(data[0].rounds[0].id)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const selectedApp = apps.find(a => a.id === selectedAppId)
  const rounds = selectedApp?.rounds ?? []
  const selectedRound = rounds.find(r => r.id === selectedRoundId) ?? null

  async function handleAddRound(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAppId) return
    setSaving(true)
    const res = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: selectedAppId, ...roundForm }),
    })
    const round = await res.json()
    if (round.id) {
      setApps(prev => prev.map(a => a.id === selectedAppId ? { ...a, rounds: [...a.rounds, round] } : a))
      setSelectedRoundId(round.id)
      setShowAddRound(false)
      setRoundForm({ roundType: "Phone Screen", interviewerName: "", interviewerTitle: "", scheduledAt: "", notes: "" })
    }
    setSaving(false)
  }

  async function updateRound(id: string, patch: Record<string, any>) {
    setApps(prev => prev.map(a => ({
      ...a,
      rounds: a.rounds.map(r => r.id === id ? { ...r, ...patch } : r)
    })))
    await fetch(`/api/interviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
  }

  async function deleteRound(id: string) {
    await fetch(`/api/interviews/${id}`, { method: "DELETE" })
    setApps(prev => prev.map(a => ({ ...a, rounds: a.rounds.filter(r => r.id !== id) })))
    if (selectedRoundId === id) setSelectedRoundId(null)
  }

  if (loading) return <p className="text-sm text-muted-foreground py-8">Loading interviews…</p>

  if (apps.length === 0) return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
      <p className="text-sm font-medium text-foreground">No active interviews</p>
      <p className="mt-1 text-sm text-muted-foreground">Move an application to Recruiter Screen or beyond in the Tracker to start logging rounds here.</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* App selector */}
      <div className="flex flex-wrap items-center gap-2">
        {apps.map(app => (
          <button key={app.id}
            onClick={() => { setSelectedAppId(app.id); setSelectedRoundId(app.rounds[0]?.id ?? null); setShowAddRound(false) }}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", selectedAppId === app.id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {app.company}
            {app.rounds.length > 0 && <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">{app.rounds.length}</span>}
          </button>
        ))}
      </div>

      {selectedApp && (
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedApp.company} — {selectedApp.role}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{rounds.length} round{rounds.length !== 1 ? "s" : ""} logged</p>
          </div>
          <button onClick={() => setShowAddRound(v => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="size-3.5" /> Add Round
          </button>
        </div>
      )}

      {/* Add round form */}
      {showAddRound && (
        <form onSubmit={handleAddRound} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 max-w-xl">
          <h3 className="text-sm font-semibold text-foreground">New Interview Round</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Round Type *</label>
              <select value={roundForm.roundType} onChange={e => setRoundForm(f => ({ ...f, roundType: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                {ROUND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Interviewer Name</label>
              <input value={roundForm.interviewerName} onChange={e => setRoundForm(f => ({ ...f, interviewerName: e.target.value }))}
                placeholder="e.g. Jane Smith"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Interviewer Title</label>
              <input value={roundForm.interviewerTitle} onChange={e => setRoundForm(f => ({ ...f, interviewerTitle: e.target.value }))}
                placeholder="e.g. Senior Engineer"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
              <input type="date" value={roundForm.scheduledAt} onChange={e => setRoundForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={roundForm.notes} onChange={e => setRoundForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="What happened in this round…"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 className="size-3.5 animate-spin" />} Save Round
            </button>
            <button type="button" onClick={() => setShowAddRound(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </form>
      )}

      {rounds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">No rounds yet — click "Add Round" to log your first interview.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* Timeline */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Timeline</h3>
            {rounds.map(round => {
              const outcomeKey = (round.outcome ?? "pending") as keyof typeof OUTCOME_CONFIG
              const cfg = OUTCOME_CONFIG[outcomeKey] ?? OUTCOME_CONFIG["pending"]
              return (
                <button key={round.id} onClick={() => setSelectedRoundId(round.id)}
                  className={cn("w-full text-left rounded-lg border p-3 transition-colors", selectedRoundId === round.id ? "border-primary/50 bg-primary/5" : "border-border hover:bg-secondary/40")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-card-foreground">{round.roundType}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", cfg.badge)}>{cfg.label}</span>
                  </div>
                  {round.interviewerName && <p className="mt-0.5 text-xs text-muted-foreground">{round.interviewerName}</p>}
                  {round.scheduledAt && <p className="mt-0.5 text-xs text-muted-foreground">{new Date(round.scheduledAt).toLocaleDateString()}</p>}
                </button>
              )
            })}
          </div>

          {/* Round detail */}
          {selectedRound && (
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-card-foreground">{selectedRound.roundType}</h2>
                  {selectedRound.interviewerName && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {selectedRound.interviewerName}{selectedRound.interviewerTitle ? ` — ${selectedRound.interviewerTitle}` : ""}
                    </p>
                  )}
                  {selectedRound.scheduledAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{new Date(selectedRound.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</p>
                  )}
                </div>
                <button onClick={() => deleteRound(selectedRound.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-red-400">
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Outcome */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outcome</p>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-background/60 p-1 w-fit">
                  {OUTCOMES.map(o => {
                    const cfg = OUTCOME_CONFIG[o as keyof typeof OUTCOME_CONFIG]
                    const active = selectedRound.outcome === o
                    return (
                      <button key={o} type="button" onClick={() => updateRound(selectedRound.id, { outcome: o })}
                        className={cn("rounded-md px-3 py-1 text-xs font-medium transition-colors", active ? cfg.badge : "text-muted-foreground hover:text-foreground")}>
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</label>
                <textarea
                  defaultValue={selectedRound.notes ?? ""}
                  onBlur={e => updateRound(selectedRound.id, { notes: e.target.value })}
                  rows={4}
                  placeholder="What happened in this round? Questions asked, topics covered, how you felt…"
                  className="w-full resize-y rounded-lg border border-border bg-background/60 p-3 text-[13px] leading-relaxed text-card-foreground outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
                />
              </div>

              {/* Questions logged */}
              {selectedRound.questions.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Questions asked</p>
                  <ul className="flex flex-col gap-2">
                    {selectedRound.questions.map(q => (
                      <li key={q.id} className="rounded-lg border border-border bg-background/60 px-3 py-2 text-[13px] text-card-foreground">
                        {q.question}
                        {q.topicTag && <span className="ml-2 text-xs text-muted-foreground">({q.topicTag})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Question bank */}
      <section>
        <h3 className="mb-1 text-sm font-bold text-foreground">Question bank</h3>
        <p className="mb-3 text-sm text-muted-foreground">All questions logged across your interviews.</p>
        <QuestionBank rounds={apps.flatMap(a => a.rounds.map(r => ({ ...r, company: a.company })))} />
      </section>
    </div>
  )
}

// Inline minimal question bank to avoid import issues
function QuestionBank({ rounds }: { rounds: (Round & { company: string })[] }) {
  const rows = rounds.flatMap(r =>
    r.questions.map(q => ({ id: q.id, question: q.question, topic: q.topicTag ?? "General", company: r.company, round: r.roundType, outcome: r.outcome }))
  )
  if (rows.length === 0) return (
    <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
      No questions logged yet. Add notes with questions in interview rounds above.
    </div>
  )
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">Question</th>
            <th className="px-4 py-3 font-semibold">Topic</th>
            <th className="px-4 py-3 font-semibold">Company</th>
            <th className="px-4 py-3 font-semibold">Round</th>
            <th className="px-4 py-3 font-semibold">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
              <td className="px-4 py-3 font-medium text-card-foreground">{r.question}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.topic}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.company}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.round}</td>
              <td className="px-4 py-3 capitalize text-muted-foreground">{r.outcome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
