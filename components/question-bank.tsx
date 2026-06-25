"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { OUTCOME_CONFIG, topicClass } from "@/lib/interview-data"
import { cn } from "@/lib/utils"

const ALL = "All"

function unique(values: string[]) {
  return [ALL, ...Array.from(new Set(values.filter(Boolean)))]
}

type DBQuestion = {
  id: string
  question: string
  topicTag?: string | null
}

type DBRound = {
  id: string
  roundType: string
  outcome?: string | null
  questions: DBQuestion[]
  company?: string
}

type BankRow = {
  id: string
  question: string
  topic: string
  company: string
  round: string
  outcome: string
}

export function QuestionBank({ rounds }: { rounds?: DBRound[] }) {
  const [query, setQuery] = useState("")
  const [topic, setTopic] = useState(ALL)
  const [round, setRound] = useState(ALL)
  const [outcome, setOutcome] = useState(ALL)

  const rows: BankRow[] = useMemo(() => {
    if (!rounds?.length) return []
    return rounds.flatMap(r =>
      (r.questions ?? []).map(q => ({
        id: q.id,
        question: q.question,
        topic: q.topicTag ?? "General",
        company: r.company ?? "",
        round: r.roundType ?? "",
        outcome: r.outcome ?? "pending",
      }))
    )
  }, [rounds])

  const topics = useMemo(() => unique(rows.map(r => r.topic)), [rows])
  const roundTypes = useMemo(() => unique(rows.map(r => r.round)), [rows])
  const outcomes = useMemo(() => unique(rows.map(r => r.outcome)), [rows])

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (query && !r.question.toLowerCase().includes(query.toLowerCase())) return false
      if (topic !== ALL && r.topic !== topic) return false
      if (round !== ALL && r.round !== round) return false
      if (outcome !== ALL && r.outcome !== outcome) return false
      return true
    })
  }, [rows, query, topic, round, outcome])

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full rounded-lg border border-border bg-background/60 py-2 pl-9 pr-3 text-sm text-card-foreground outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <FilterSelect label="Topic" value={topic} options={topics} onChange={setTopic} />
        <FilterSelect label="Round" value={round} options={roundTypes} onChange={setRound} />
        <FilterSelect label="Outcome" value={outcome} options={outcomes} onChange={setOutcome} capitalize />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Question</th>
              <th className="px-4 py-3 font-semibold">Topic</th>
              <th className="px-4 py-3 font-semibold">Round</th>
              <th className="px-4 py-3 font-semibold">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium text-card-foreground">{r.question}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", topicClass(r.topic))}>
                    {r.topic}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.round}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", (OUTCOME_CONFIG as any)[r.outcome]?.dot ?? "bg-muted")} />
                    <span className="text-muted-foreground capitalize">{r.outcome}</span>
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {rows.length === 0 ? "No questions logged yet. Add rounds and questions in interviews." : "No questions match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilterSelect({ label, value, options, onChange, capitalize }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; capitalize?: boolean
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn("rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-card-foreground outline-none", capitalize && "capitalize")}
    >
      {options.map(o => (
        <option key={o} value={o}>{o === ALL ? `${label}: All` : o}</option>
      ))}
    </select>
  )
}
