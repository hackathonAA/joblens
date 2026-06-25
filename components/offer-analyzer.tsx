"use client"

import { useState } from "react"
import { FileText, RotateCcw, Loader2, Plus, TrendingUp, RefreshCw, Check } from "lucide-react"
import {
  type Clause,
  OFFER_TEXT,
  RISK_CONFIG,
  riskCounts,
} from "@/lib/offer-data"
import { ClauseCard } from "@/components/clause-card"
import { OfferTextView } from "@/components/offer-text-view"
import { OfferUpload } from "@/components/offer-upload"
import { cn } from "@/lib/utils"

type Suggestion = {
  type: "add-to-tracker" | "add-to-war-room" | "update-offer"
  message: string
  data?: any
  appPatch?: any
  meta?: Meta
}

type Meta = {
  company?: string
  role?: string
  baseSalary?: number
  signingBonus?: number
  equityValue?: number
  vestingSchedule?: string
  startDate?: string
}

const SUGGESTION_CONFIG = {
  "add-to-tracker": { icon: Plus, color: "border-blue-500/30 bg-blue-500/5", iconColor: "text-blue-400", btnColor: "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30" },
  "add-to-war-room": { icon: TrendingUp, color: "border-emerald-500/30 bg-emerald-500/5", iconColor: "text-emerald-400", btnColor: "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30" },
  "update-offer": { icon: RefreshCw, color: "border-amber-500/30 bg-amber-500/5", iconColor: "text-amber-400", btnColor: "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30" },
}

function SuggestionBanner({ suggestion, onDismiss, onFollowUp }: { suggestion: Suggestion; onDismiss: () => void; onFollowUp?: (s: Suggestion) => void }) {
  const [acting, setActing] = useState(false)
  const [done, setDone] = useState(false)
  const cfg = SUGGESTION_CONFIG[suggestion.type]
  const Icon = cfg.icon

  async function handleAction() {
    setActing(true)
    try {
      if (suggestion.type === "add-to-tracker") {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(suggestion.data),
        })
        const newApp = await res.json()
        setDone(true)
        // Offer follow-up after tracker add
        if (newApp.id && suggestion.meta && onFollowUp) {
          setTimeout(() => {
            onFollowUp({
              type: "add-to-war-room",
              message: `Want to add this offer to War Room to compare it with others?`,
              data: {
                applicationId: newApp.id,
                baseSalary: suggestion.meta.baseSalary,
                equityValue: suggestion.meta.equityValue,
                signingBonus: suggestion.meta.signingBonus,
                vestingSchedule: suggestion.meta.vestingSchedule,
                startDate: suggestion.meta.startDate,
              },
            })
          }, 1600)
        } else {
          setTimeout(onDismiss, 1500)
        }
      } else if (suggestion.type === "add-to-war-room") {
        await fetch("/api/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(suggestion.data),
        })
        if (suggestion.appPatch && suggestion.data?.applicationId) {
          const patch = Object.fromEntries(Object.entries(suggestion.appPatch).filter(([, v]) => v !== undefined))
          if (Object.keys(patch).length) {
            await fetch(`/api/applications/${suggestion.data.applicationId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patch),
            })
          }
        }
        setDone(true)
        setTimeout(onDismiss, 1500)
      } else if (suggestion.type === "update-offer") {
        await fetch(`/api/offers/${suggestion.data.offerId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(suggestion.data.updates),
        })
      }
      setDone(true)
      setTimeout(onDismiss, 1500)
    } finally {
      setActing(false)
    }
  }

  const actionLabel = {
    "add-to-tracker": "Add to Tracker",
    "add-to-war-room": "Add to War Room",
    "update-offer": "Update offer",
  }[suggestion.type]

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-3", cfg.color)}>
      <Icon className={cn("size-4 mt-0.5 shrink-0", cfg.iconColor)} />
      <p className="flex-1 text-xs text-muted-foreground">{suggestion.message}</p>
      <div className="flex items-center gap-1.5 shrink-0">
        {done ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400"><Check className="size-3" /> Done</span>
        ) : (
          <button
            onClick={handleAction}
            disabled={acting}
            className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors", cfg.btnColor)}
          >
            {acting && <Loader2 className="size-3 animate-spin" />}
            {actionLabel}
          </button>
        )}
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground text-xs px-1">✕</button>
      </div>
    </div>
  )
}

export function OfferAnalyzer() {
  const [loaded, setLoaded] = useState(false)
  const [pasted, setPasted] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [clauses, setClauses] = useState<Clause[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offerText, setOfferText] = useState("")
  const [meta, setMeta] = useState<Meta | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  const counts = riskCounts(clauses)

  async function analyze(text: string) {
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch("/api/analyze-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setClauses(data.clauses)
      setMeta(data.meta ?? null)
      setSuggestions(data.suggestions?.map((s: Suggestion) =>
        s.type === "add-to-tracker" ? { ...s, meta: data.meta ?? null } : s
      ) ?? [])
      setOfferText(text)
      setLoaded(true)
    } catch (e: any) {
      setError(e.message ?? "Analysis failed")
    } finally {
      setAnalyzing(false)
    }
  }

  function handleToggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function reset() {
    setLoaded(false)
    setPasted("")
    setExpandedId(null)
    setClauses([])
    setOfferText("")
    setMeta(null)
    setSuggestions([])
    setError(null)
  }

  return (
    <div className="grid h-full gap-4 lg:grid-cols-2">
      {/* LEFT PANEL */}
      <section className="flex min-h-0 flex-col gap-4">
        {!loaded ? (
          <>
            <OfferUpload onLoadSample={() => analyze(OFFER_TEXT)} onFileText={(text) => analyze(text)} />
            <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card/40 p-1">
              <textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="…or paste your offer letter text here"
                className="min-h-48 flex-1 resize-none rounded-md bg-transparent p-4 text-[13px] leading-relaxed text-card-foreground outline-none placeholder:text-muted-foreground"
              />
              {error && <p className="px-4 pb-2 text-xs text-red-400">{error}</p>}
              {pasted.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => analyze(pasted)}
                  disabled={analyzing}
                  className="m-2 flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {analyzing && <Loader2 className="size-3 animate-spin" />}
                  {analyzing ? "Analyzing…" : "Analyze with Claude"}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <FileText className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    {meta?.company ? `${meta.company}${meta.role ? ` · ${meta.role}` : ""}` : "Offer Analysis"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {clauses.length} clauses identified
                    {meta?.baseSalary ? ` · $${(meta.baseSalary / 1000).toFixed(0)}k base` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
              >
                <RotateCcw className="size-3.5" />
                New
              </button>
            </div>

            {/* Smart suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-col gap-2">
                {suggestions.map((s, i) => (
                  <SuggestionBanner
                    key={i}
                    suggestion={s}
                    onDismiss={() => setSuggestions(prev => prev.filter((_, j) => j !== i))}
                    onFollowUp={(followUp) => setSuggestions(prev => [...prev.filter((_, j) => j !== i), followUp])}
                  />
                ))}
              </div>
            )}

            <div className="min-h-0 flex-1">
              <OfferTextView
                text={offerText}
                clauses={clauses}
                activeClauseId={activeId}
                onHighlightClick={(id) => {
                  setActiveId(id)
                  setExpandedId(id)
                }}
              />
            </div>
          </>
        )}
      </section>

      {/* RIGHT PANEL */}
      <section className="flex min-h-0 flex-col gap-4">
        <div className="grid grid-cols-4 gap-2 rounded-lg border border-border bg-card p-3">
          <SummaryStat label="Clauses" value={clauses.length} dot="bg-muted-foreground" />
          <SummaryStat label="Standard" value={counts.green} dot={RISK_CONFIG.green.dot} />
          <SummaryStat label="Negotiate" value={counts.yellow} dot={RISK_CONFIG.yellow.dot} />
          <SummaryStat label="Flag" value={counts.red} dot={RISK_CONFIG.red.dot} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {!loaded ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-card/30 p-8 text-center text-sm text-muted-foreground">
              {analyzing ? (
                <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> AI is analyzing your offer…</span>
              ) : (
                "Upload or paste an offer letter to see a clause-by-clause breakdown."
              )}
            </div>
          ) : (
            clauses.map((clause) => (
              <ClauseCard
                key={clause.id}
                clause={clause}
                expanded={expandedId === clause.id}
                active={activeId === clause.id}
                onToggle={() => handleToggle(clause.id)}
                onHover={setActiveId}
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function SummaryStat({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-md bg-secondary/50 py-2">
      <span className="text-xl font-bold text-card-foreground">{value}</span>
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <span className={`size-1.5 rounded-full ${dot}`} />
        {label}
      </span>
    </div>
  )
}
