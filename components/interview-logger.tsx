"use client"

import { useEffect, useState, useRef } from "react"
import {
  Plus, Loader2, Trash2, Sparkles, ChevronRight,
  CheckCircle, AlertCircle, RotateCcw, Send, X, BookOpen
} from "lucide-react"
import { OUTCOME_CONFIG } from "@/lib/interview-data"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  id: string
  question: string
  topicTag?: string | null
  whatISaid?: string | null
  aiAnswer?: string | null
  rating?: number | null
  aiRatingReason?: string | null
}

type Round = {
  id: string
  applicationId: string
  roundType: string
  interviewerName?: string | null
  interviewerTitle?: string | null
  scheduledAt?: string | null
  outcome: string
  notes?: string | null
  overallExperience?: string | null
  confidenceScore?: number | null
  confidenceReason?: string | null
  questions: Question[]
}

type App = { id: string; company: string; role: string; level?: string | null; rounds: Round[] }

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUND_TYPES = [
  "Phone Screen", "Recruiter Screen", "Technical Round", "System Design",
  "Behavioral", "Final Round", "Onsite", "Take-Home", "Other"
]
const OUTCOMES = ["pending", "passed", "failed"]
const TOPIC_TAGS = ["Behavioral", "Technical", "System Design", "Culture Fit", "Problem Solving", "Leadership", "Other"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-400"
  if (score >= 50) return "text-yellow-400"
  return "text-red-400"
}

function scoreBg(score: number) {
  if (score >= 75) return "bg-emerald-500/15 border-emerald-500/30"
  if (score >= 50) return "bg-yellow-500/15 border-yellow-500/30"
  return "bg-red-500/15 border-red-500/30"
}

function ratingBadge(r: number) {
  if (r >= 8) return "bg-emerald-500/15 text-emerald-400"
  if (r >= 5) return "bg-yellow-500/15 text-yellow-400"
  return "bg-red-500/15 text-red-400"
}

function RatingDots({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className={cn("size-1.5 rounded-full", i < rating ? "bg-primary" : "bg-border")} />
      ))}
      <span className="ml-1.5 text-xs font-semibold text-card-foreground">{rating}/10</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InterviewLogger() {
  const [apps, setApps] = useState<App[]>([])
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddRound, setShowAddRound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"questions" | "experience">("questions")
  const [roundForm, setRoundForm] = useState({
    roundType: "Phone Screen", interviewerName: "", interviewerTitle: "", scheduledAt: "", notes: ""
  })

  useEffect(() => {
    fetch("/api/interviews")
      .then(r => r.ok ? r.json() : [])
      .then((data: App[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setApps(data)
          setSelectedAppId(data[0].id)
          if (data[0].rounds.length > 0) setSelectedRoundId(data[0].rounds[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const selectedApp = apps.find(a => a.id === selectedAppId)
  const rounds = selectedApp?.rounds ?? []
  const selectedRound = rounds.find(r => r.id === selectedRoundId) ?? null

  function patchRoundLocal(roundId: string, patch: Partial<Round>) {
    setApps(prev => prev.map(a => ({
      ...a,
      rounds: a.rounds.map(r => r.id === roundId ? { ...r, ...patch } : r)
    })))
  }

  function patchQuestionLocal(roundId: string, qId: string, patch: Partial<Question>) {
    setApps(prev => prev.map(a => ({
      ...a,
      rounds: a.rounds.map(r => r.id !== roundId ? r : {
        ...r,
        questions: r.questions.map(q => q.id === qId ? { ...q, ...patch } : q)
      })
    })))
  }

  function deleteQuestionLocal(roundId: string, qId: string) {
    setApps(prev => prev.map(a => ({
      ...a,
      rounds: a.rounds.map(r => r.id !== roundId ? r : {
        ...r,
        questions: r.questions.filter(q => q.id !== qId)
      })
    })))
  }

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
    patchRoundLocal(id, patch)
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
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              selectedAppId === app.id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
            {app.company}
            {app.rounds.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">{app.rounds.length}</span>
            )}
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
              <div className="flex gap-2">
                <select value={ROUND_TYPES.includes(roundForm.roundType) ? roundForm.roundType : "Other"}
                  onChange={e => setRoundForm(f => ({ ...f, roundType: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                  {ROUND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  value={roundForm.roundType}
                  onChange={e => setRoundForm(f => ({ ...f, roundType: e.target.value }))}
                  placeholder="Or type custom name e.g. Bar Raiser, OA…"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
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
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Quick notes</label>
              <textarea value={roundForm.notes} onChange={e => setRoundForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Any quick notes before you log questions…"
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
          {/* Timeline sidebar */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Timeline</h3>
            {rounds.map(round => {
              const outcomeKey = (round.outcome ?? "pending") as keyof typeof OUTCOME_CONFIG
              const cfg = OUTCOME_CONFIG[outcomeKey] ?? OUTCOME_CONFIG["pending"]
              return (
                <button key={round.id} onClick={() => setSelectedRoundId(round.id)}
                  className={cn("w-full text-left rounded-lg border p-3 transition-colors",
                    selectedRoundId === round.id ? "border-primary/50 bg-primary/5" : "border-border hover:bg-secondary/40"
                  )}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-card-foreground truncate">{round.roundType}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0", cfg.badge)}>{cfg.label}</span>
                  </div>
                  {round.interviewerName && <p className="mt-0.5 text-xs text-muted-foreground truncate">{round.interviewerName}</p>}
                  {round.scheduledAt && <p className="mt-0.5 text-xs text-muted-foreground">{new Date(round.scheduledAt).toLocaleDateString()}</p>}
                  {round.confidenceScore != null && (
                    <p className={cn("mt-1.5 text-xs font-semibold", scoreColor(round.confidenceScore))}>
                      {round.confidenceScore}% confidence
                    </p>
                  )}
                  {round.questions.length > 0 && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{round.questions.length} question{round.questions.length !== 1 ? "s" : ""}</p>
                  )}
                </button>
              )
            })}
          </div>

          {/* Round detail */}
          {selectedRound && (
            <RoundDetail
              round={selectedRound}
              onUpdateRound={updateRound}
              onDeleteRound={deleteRound}
              onPatchRoundLocal={patchRoundLocal}
              onPatchQuestionLocal={patchQuestionLocal}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
      )}

      {/* Question bank */}
      <section>
        <h3 className="mb-1 text-sm font-bold text-foreground">Question bank</h3>
        <p className="mb-3 text-sm text-muted-foreground">All questions logged across your interviews.</p>
        <QuestionBank
          rounds={apps.flatMap(a => a.rounds.map(r => ({ ...r, company: a.company })))}
          onPatchQuestion={patchQuestionLocal}
          onDeleteQuestion={deleteQuestionLocal}
        />
      </section>
    </div>
  )
}

// ─── Round Detail Panel ───────────────────────────────────────────────────────

function RoundDetail({
  round,
  onUpdateRound,
  onDeleteRound,
  onPatchRoundLocal,
  onPatchQuestionLocal,
  activeTab,
  setActiveTab,
}: {
  round: Round
  onUpdateRound: (id: string, patch: Record<string, any>) => Promise<void>
  onDeleteRound: (id: string) => Promise<void>
  onPatchRoundLocal: (roundId: string, patch: Partial<Round>) => void
  onPatchQuestionLocal: (roundId: string, qId: string, patch: Partial<Question>) => void
  activeTab: "questions" | "experience"
  setActiveTab: (t: "questions" | "experience") => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-card-foreground">{round.roundType}</h2>
          {round.interviewerName && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {round.interviewerName}{round.interviewerTitle ? ` — ${round.interviewerTitle}` : ""}
            </p>
          )}
          {round.scheduledAt && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Date(round.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
        <button onClick={() => onDeleteRound(round.id)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-red-400">
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* Outcome toggle */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outcome</p>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background/60 p-1 w-fit">
          {OUTCOMES.map(o => {
            const cfg = OUTCOME_CONFIG[o as keyof typeof OUTCOME_CONFIG]
            const active = round.outcome === o
            return (
              <button key={o} type="button" onClick={() => onUpdateRound(round.id, { outcome: o })}
                className={cn("rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  active ? cfg.badge : "text-muted-foreground hover:text-foreground"
                )}>
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Confidence Score */}
      {round.confidenceScore != null && (
        <div className={cn("rounded-xl border p-4", scoreBg(round.confidenceScore))}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-semibold text-card-foreground">Round Confidence Score</span>
            </div>
            <span className={cn("text-2xl font-bold", scoreColor(round.confidenceScore))}>
              {round.confidenceScore}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mb-2">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${round.confidenceScore}%` }} />
          </div>
          {round.confidenceReason && (
            <p className="text-xs text-muted-foreground leading-relaxed">{round.confidenceReason}</p>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground">Powered by Amazon Nova</p>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-background/60 p-1 w-fit">
        <button onClick={() => setActiveTab("questions")}
          className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
            activeTab === "questions" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
          )}>
          <BookOpen className="size-3.5" /> Practice Questions
        </button>
        <button onClick={() => setActiveTab("experience")}
          className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
            activeTab === "experience" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
          )}>
          <Sparkles className="size-3.5" /> Experience & Score
        </button>
      </div>

      {activeTab === "questions" ? (
        <PracticeQuestionsTab
          round={round}
          onPatchQuestionLocal={onPatchQuestionLocal}
        />
      ) : (
        <ExperienceTab
          round={round}
          onUpdateRound={onUpdateRound}
          onPatchRoundLocal={onPatchRoundLocal}
        />
      )}
    </div>
  )
}

// ─── Practice Questions Tab ───────────────────────────────────────────────────

function PracticeQuestionsTab({
  round,
  onPatchQuestionLocal,
}: {
  round: Round
  onPatchQuestionLocal: (roundId: string, qId: string, patch: Partial<Question>) => void
}) {
  const [newQuestion, setNewQuestion] = useState("")
  const [newTopic, setNewTopic] = useState("Behavioral")
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  async function handleAddQuestion() {
    if (!newQuestion.trim()) return
    setAddingQuestion(true)
    const res = await fetch("/api/interviews/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: round.id, question: newQuestion.trim(), topicTag: newTopic }),
    })
    const saved = await res.json()
    if (saved.id) {
      onPatchQuestionLocal(round.id, saved.id, saved)
      // Actually add to the round — we need to refresh the full list
      // Trigger a full questions refresh by adding a fake entry then replacing
    }
    setNewQuestion("")
    setShowAddForm(false)
    setAddingQuestion(false)
    // Reload this round's questions from server
    const roundRes = await fetch("/api/interviews")
    const allApps = await roundRes.json()
    // We handle this via a targeted re-fetch approach below
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Questions ({round.questions.length})
        </p>
        <button onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80">
          <Plus className="size-3.5" /> Add question
        </button>
      </div>

      {/* Add question form */}
      {showAddForm && (
        <AddQuestionForm
          roundId={round.id}
          onAdded={(q) => {
            onPatchQuestionLocal(round.id, q.id, q)
            // force a page reload of the questions list
            window.location.reload()
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {round.questions.length === 0 && !showAddForm && (
        <div className="rounded-xl border border-dashed border-border py-8 text-center">
          <p className="text-sm text-muted-foreground">No questions logged yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Click "Add question" to log a question asked in this round.</p>
        </div>
      )}

      {round.questions.map(q => (
        <QuestionCard
          key={q.id}
          question={q}
          roundId={round.id}
          onPatch={(patch) => onPatchQuestionLocal(round.id, q.id, patch)}
        />
      ))}
    </div>
  )
}

// ─── Add Question Form ────────────────────────────────────────────────────────

function AddQuestionForm({ roundId, onAdded, onCancel }: {
  roundId: string
  onAdded: (q: Question) => void
  onCancel: () => void
}) {
  const [question, setQuestion] = useState("")
  const [topic, setTopic] = useState("Behavioral")
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!question.trim()) return
    setLoading(true)
    const res = await fetch("/api/interviews/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId, question: question.trim(), topicTag: topic }),
    })
    const saved = await res.json()
    if (saved.id) onAdded(saved)
    setLoading(false)
  }

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4 flex flex-col gap-3">
      <p className="text-xs font-semibold text-card-foreground">Log a question asked in this round</p>
      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="e.g. Tell me about a time you had a conflict with a team member…"
        rows={2}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex items-center gap-3">
        <select value={topic} onChange={e => setTopic(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary">
          {TOPIC_TAGS.map(t => <option key={t}>{t}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={loading || !question.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {loading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            {loading ? "Getting AI answer…" : "Add & get AI answer"}
          </button>
        </div>
      </div>
      {loading && (
        <p className="text-[11px] text-muted-foreground">Amazon Nova is generating a model answer for this question…</p>
      )}
    </div>
  )
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({ question, roundId, onPatch }: {
  question: Question
  roundId: string
  onPatch: (patch: Partial<Question>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [myAnswer, setMyAnswer] = useState(question.whatISaid ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [showAiAnswer, setShowAiAnswer] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasSubmitted = !!question.whatISaid && question.rating != null

  async function submitAnswer() {
    if (!myAnswer.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/interviews/questions/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatISaid: myAnswer.trim() }),
    })
    const updated = await res.json()
    onPatch(updated)
    setSubmitting(false)
  }

  async function deleteQuestion() {
    await fetch(`/api/interviews/questions/${question.id}`, { method: "DELETE" })
    onPatch({ id: question.id } as any) // parent should handle removal
    window.location.reload()
  }

  return (
    <div className={cn(
      "rounded-xl border transition-colors",
      expanded ? "border-primary/40 bg-card" : "border-border hover:border-border/80 bg-card/50"
    )}>
      {/* Question header */}
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <ChevronRight className={cn("size-4 shrink-0 mt-0.5 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-foreground leading-snug">{question.question}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {question.topicTag && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{question.topicTag}</span>
            )}
            {question.rating != null && (
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", ratingBadge(question.rating))}>
                {question.rating}/10
              </span>
            )}
            {!question.whatISaid && (
              <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-400">Needs your answer</span>
            )}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); deleteQuestion() }}
          className="rounded p-1 text-muted-foreground hover:text-red-400 shrink-0">
          <X className="size-3.5" />
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-4 flex flex-col gap-4">
          {/* AI Model Answer */}
          {question.aiAnswer && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">AI Model Answer</span>
                  <span className="text-[10px] text-muted-foreground">by Amazon Nova</span>
                </div>
                <button onClick={() => setShowAiAnswer(v => !v)}
                  className="text-[10px] text-muted-foreground hover:text-foreground">
                  {showAiAnswer ? "Hide" : "Show"}
                </button>
              </div>
              {showAiAnswer && (
                <p className="text-[13px] text-card-foreground leading-relaxed whitespace-pre-wrap">{question.aiAnswer}</p>
              )}
              {!showAiAnswer && (
                <p className="text-xs text-muted-foreground italic">Click "Show" to reveal — try answering first!</p>
              )}
            </div>
          )}

          {/* User's answer input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {hasSubmitted ? "Your answer (submitted)" : "Your answer"}
            </label>
            <textarea
              ref={textareaRef}
              value={myAnswer}
              onChange={e => setMyAnswer(e.target.value)}
              placeholder="Type what you actually said in the interview… Be honest — this is for your learning."
              rows={4}
              disabled={hasSubmitted && !submitting}
              className={cn(
                "w-full resize-y rounded-lg border bg-background/60 px-3 py-2 text-[13px] leading-relaxed text-card-foreground outline-none transition-colors focus:ring-1",
                hasSubmitted ? "border-border/50 opacity-80 cursor-not-allowed" : "border-border focus:border-primary/60 focus:ring-primary/40"
              )}
            />
            {!hasSubmitted && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-muted-foreground">AI will compare your answer to the model answer and rate you 1–10</p>
                <button onClick={submitAnswer} disabled={submitting || !myAnswer.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  {submitting ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                  {submitting ? "Evaluating…" : "Submit for AI rating"}
                </button>
              </div>
            )}
            {hasSubmitted && (
              <button onClick={() => {
                onPatch({ whatISaid: null, rating: null, aiRatingReason: null })
                setMyAnswer("")
              }}
                className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                <RotateCcw className="size-3" /> Re-answer
              </button>
            )}
          </div>

          {/* Rating result */}
          {question.rating != null && question.aiRatingReason && (
            <div className={cn("rounded-lg border p-3", question.rating >= 8 ? "bg-emerald-500/10 border-emerald-500/30" : question.rating >= 5 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30")}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-semibold text-card-foreground">AI Rating</span>
                <RatingDots rating={question.rating} />
              </div>
              <p className="text-[13px] text-card-foreground leading-relaxed">{question.aiRatingReason}</p>
              {question.aiAnswer && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">Compare with model answer:</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{question.aiAnswer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Experience Tab ───────────────────────────────────────────────────────────

function ExperienceTab({
  round,
  onUpdateRound,
  onPatchRoundLocal,
}: {
  round: Round
  onUpdateRound: (id: string, patch: Record<string, any>) => Promise<void>
  onPatchRoundLocal: (roundId: string, patch: Partial<Round>) => void
}) {
  const [experience, setExperience] = useState(round.overallExperience ?? "")
  const [scoring, setScoring] = useState(false)
  const [scored, setScored] = useState(false)

  const ratedCount = round.questions.filter(q => q.rating != null).length
  const avgRating = ratedCount > 0
    ? round.questions.filter(q => q.rating != null).reduce((s, q) => s + (q.rating ?? 0), 0) / ratedCount
    : null

  async function computeConfidence() {
    setScoring(true)
    setScored(false)
    const res = await fetch(`/api/interviews/${round.id}/confidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overallExperience: experience.trim() || undefined }),
    })
    const { score, reason } = await res.json()
    onPatchRoundLocal(round.id, {
      confidenceScore: score,
      confidenceReason: reason,
      overallExperience: experience.trim() || undefined,
    })
    setScoring(false)
    setScored(true)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Confidence Score Hero ── */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl border p-5",
        round.confidenceScore != null ? scoreBg(round.confidenceScore) : "border-border bg-background/40"
      )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="size-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Round Confidence</span>
            </div>
            {round.confidenceScore != null ? (
              <>
                <div className="flex items-end gap-3 mb-3">
                  <span className={cn("text-5xl font-black leading-none", scoreColor(round.confidenceScore))}>
                    {round.confidenceScore}
                  </span>
                  <span className={cn("text-xl font-bold mb-1", scoreColor(round.confidenceScore))}>%</span>
                  <span className="text-sm text-muted-foreground mb-1.5">chance of clearing</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/60 mb-3">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700",
                      round.confidenceScore >= 75 ? "bg-emerald-500" : round.confidenceScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${round.confidenceScore}%` }}
                  />
                </div>
                {round.confidenceReason && (
                  <p className="text-[13px] text-card-foreground leading-relaxed">{round.confidenceReason}</p>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">Powered by Amazon Nova</p>
              </>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  AI will analyze your question ratings + experience note to estimate your chances.
                </p>
                {ratedCount === 0 && (
                  <p className="mt-1.5 text-xs text-yellow-400 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    Rate some questions in the Practice tab first for a more accurate score.
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={computeConfidence}
            disabled={scoring}
            className={cn(
              "shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50",
              round.confidenceScore != null
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                : "bg-primary text-primary-foreground hover:opacity-90"
            )}>
            {scoring ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {scoring ? "Analyzing…" : round.confidenceScore != null ? "Re-score" : "Get score"}
          </button>
        </div>
        {scored && !scoring && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle className="size-3.5" /> Score updated
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: round.questions.length, label: "Questions logged", sub: null },
          { value: ratedCount, label: "Answers rated", sub: `${round.questions.length - ratedCount} pending` },
          { value: avgRating != null ? avgRating.toFixed(1) : "—", label: "Avg rating", sub: avgRating != null ? "/10" : "no data yet" },
        ].map(({ value, label, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-2xl font-bold text-card-foreground leading-none">{value}</p>
            {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
            <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Overall Experience ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overall Experience</label>
          <span className="text-[10px] text-muted-foreground">Saved on blur</span>
        </div>
        <textarea
          value={experience}
          onChange={e => setExperience(e.target.value)}
          onBlur={() => { if (experience !== round.overallExperience) onUpdateRound(round.id, { overallExperience: experience }) }}
          rows={4}
          placeholder="How did it feel? Nervous, confident, engaged interviewer? Any red flags? Write freely — this improves your AI score."
          className="w-full resize-none rounded-xl border border-border bg-background/60 p-3.5 text-[13px] leading-relaxed text-card-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
        />
      </div>

      {/* ── Answer Performance breakdown ── */}
      {round.questions.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Answer Performance</p>
          <div className="flex flex-col gap-2">
            {round.questions.map(q => {
              const r = q.rating
              const pct = r != null ? (r / 10) * 100 : null
              return (
                <div key={q.id} className="rounded-xl border border-border bg-background/40 px-4 py-3">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-[13px] font-medium text-card-foreground leading-snug flex-1">{q.question}</p>
                    {r != null ? (
                      <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", ratingBadge(r))}>
                        {r}/10
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-secondary/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                        Not rated
                      </span>
                    )}
                  </div>
                  {pct != null && (
                    <div className="h-1 w-full overflow-hidden rounded-full bg-secondary/60">
                      <div
                        className={cn("h-full rounded-full",
                          r! >= 8 ? "bg-emerald-500" : r! >= 5 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  {q.topicTag && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{q.topicTag}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Question Bank ────────────────────────────────────────────────────────────

function QuestionBank({ rounds, onPatchQuestion, onDeleteQuestion }: {
  rounds: (Round & { company: string })[]
  onPatchQuestion: (roundId: string, qId: string, patch: Partial<Question>) => void
  onDeleteQuestion: (roundId: string, qId: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ question: string; topicTag: string }>({ question: "", topicTag: "" })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const rows = rounds.flatMap(r =>
    r.questions.map(q => ({
      id: q.id, roundId: r.id, question: q.question, topic: q.topicTag ?? "General",
      company: r.company, round: r.roundType, outcome: r.outcome, rating: q.rating,
      whatISaid: q.whatISaid, aiRatingReason: q.aiRatingReason,
    }))
  )

  function startEdit(row: typeof rows[0]) {
    setConfirmDeleteId(null)
    setEditingId(row.id)
    setEditForm({ question: row.question, topicTag: row.topic })
  }

  async function saveEdit(row: typeof rows[0]) {
    await fetch(`/api/interviews/questions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: editForm.question, topicTag: editForm.topicTag }),
    })
    onPatchQuestion(row.roundId, row.id, { question: editForm.question, topicTag: editForm.topicTag })
    setEditingId(null)
  }

  async function confirmDelete(row: typeof rows[0]) {
    await fetch(`/api/interviews/questions/${row.id}`, { method: "DELETE" })
    onDeleteQuestion(row.roundId, row.id)
    setConfirmDeleteId(null)
  }

  if (rows.length === 0) return (
    <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
      No questions logged yet. Add questions inside interview rounds above.
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
            <th className="px-4 py-3 font-semibold">Rating</th>
            <th className="px-4 py-3 font-semibold w-20"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30 group">
              {editingId === r.id ? (
                <>
                  <td className="px-4 py-2" colSpan={2}>
                    <div className="flex flex-col gap-1.5">
                      <input
                        autoFocus
                        value={editForm.question}
                        onChange={e => setEditForm(f => ({ ...f, question: e.target.value }))}
                        className="w-full rounded-lg border border-primary/50 bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                      />
                      <select
                        value={editForm.topicTag}
                        onChange={e => setEditForm(f => ({ ...f, topicTag: e.target.value }))}
                        className="w-fit rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                      >
                        {TOPIC_TAGS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{r.company}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.round}</td>
                  <td className="px-4 py-2">
                    {r.rating != null ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", ratingBadge(r.rating))}>
                        {r.rating}/10
                      </span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => saveEdit(r)}
                        className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground">
                        Cancel
                      </button>
                    </div>
                  </td>
                </>
              ) : confirmDeleteId === r.id ? (
                <>
                  <td className="px-4 py-3" colSpan={5}>
                    <div className="flex items-center gap-3">
                      <AlertCircle className="size-4 text-red-400 shrink-0" />
                      <p className="text-sm text-card-foreground flex-1 truncate">
                        Delete <span className="font-medium">"{r.question.slice(0, 60)}{r.question.length > 60 ? "…" : ""}"</span>?
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => confirmDelete(r)}
                        className="rounded-md bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/25">
                        Delete
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground">
                        Keep
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 py-3 font-medium text-card-foreground max-w-xs">
                    <p className="truncate">{r.question}</p>
                    {r.whatISaid && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground truncate italic">Your answer: {r.whatISaid}</p>
                    )}
                    {r.aiRatingReason && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{r.aiRatingReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.topic}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.company}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.round}</td>
                  <td className="px-4 py-3">
                    {r.rating != null ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", ratingBadge(r.rating))}>
                        {r.rating}/10
                      </span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(r)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        title="Edit question">
                        <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z" />
                        </svg>
                      </button>
                      <button onClick={() => { setEditingId(null); setConfirmDeleteId(r.id) }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                        title="Delete question">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
