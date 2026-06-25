"use client"

import { type Clause, RISK_CONFIG } from "@/lib/offer-data"
import { cn } from "@/lib/utils"

type Segment = {
  text: string
  clause?: Clause
}

/** Split the raw text into highlighted (clause) and plain segments. */
function buildSegments(text: string, clauses: Clause[]): Segment[] {
  // Find each excerpt's position in the text
  const marks = clauses
    .map((clause) => ({ clause, index: text.indexOf(clause.excerpt) }))
    .filter((m) => m.index !== -1)
    .sort((a, b) => a.index - b.index)

  const segments: Segment[] = []
  let cursor = 0

  for (const mark of marks) {
    if (mark.index > cursor) {
      segments.push({ text: text.slice(cursor, mark.index) })
    }
    segments.push({
      text: mark.clause.excerpt,
      clause: mark.clause,
    })
    cursor = mark.index + mark.clause.excerpt.length
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) })
  }
  return segments
}

export function OfferTextView({
  text,
  clauses,
  activeClauseId,
  onHighlightClick,
}: {
  text: string
  clauses: Clause[]
  activeClauseId: string | null
  onHighlightClick: (id: string) => void
}) {
  const segments = buildSegments(text, clauses)

  return (
    <div className="h-full overflow-y-auto rounded-lg border border-border bg-card/40 p-5">
      <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-muted-foreground">
        {segments.map((seg, i) => {
          if (!seg.clause) return <span key={i}>{seg.text}</span>
          const cfg = RISK_CONFIG[seg.clause.risk]
          const isActive = activeClauseId === seg.clause.id
          return (
            <mark
              key={i}
              onClick={() => onHighlightClick(seg.clause!.id)}
              className={cn(
                "cursor-pointer rounded px-0.5 py-0.5 text-card-foreground transition-all",
                cfg.highlight,
                isActive && "ring-2 ring-offset-2 ring-offset-card",
              )}
              title={`${seg.clause.name} — ${RISK_CONFIG[seg.clause.risk].label}`}
            >
              {seg.text}
            </mark>
          )
        })}
      </pre>
    </div>
  )
}
