"use client"

import {
  type InterviewRound,
  OUTCOME_CONFIG,
} from "@/lib/interview-data"
import { cn } from "@/lib/utils"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function InterviewTimeline({
  rounds,
  selectedId,
  onSelect,
}: {
  rounds: InterviewRound[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <ol className="flex flex-col gap-1">
      {rounds.map((round, i) => {
        const cfg = OUTCOME_CONFIG[round.outcome]
        const selected = round.id === selectedId
        const isLast = i === rounds.length - 1
        return (
          <li key={round.id} className="relative flex gap-3">
            {/* Rail */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-3 size-3 shrink-0 rounded-full ring-4 ring-background",
                  cfg.dot,
                )}
                aria-hidden
              />
              {!isLast && <span className="w-px flex-1 bg-border" />}
            </div>

            <button
              type="button"
              onClick={() => onSelect(round.id)}
              aria-pressed={selected}
              className={cn(
                "mb-1 flex flex-1 flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-all",
                "hover:border-primary/40",
                selected && "border-primary/60 ring-1 ring-primary/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-card-foreground">
                  {round.type}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    cfg.badge,
                  )}
                >
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(round.date)}</span>
                <span aria-hidden>·</span>
                <span className="truncate">{round.interviewer}</span>
              </div>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
