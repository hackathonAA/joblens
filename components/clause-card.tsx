"use client"

import { ChevronDown, PencilLine } from "lucide-react"
import { type Clause, RISK_CONFIG } from "@/lib/offer-data"
import { cn } from "@/lib/utils"

export function ClauseCard({
  clause,
  expanded,
  active,
  onToggle,
  onHover,
}: {
  clause: Clause
  expanded: boolean
  active: boolean
  onToggle: () => void
  onHover: (id: string | null) => void
}) {
  const cfg = RISK_CONFIG[clause.risk]

  return (
    <div
      onMouseEnter={() => onHover(clause.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm transition-all",
        active && "ring-1 ring-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn("size-2.5 shrink-0 rounded-full", cfg.dot)} />
          <h3 className="text-sm font-bold text-card-foreground">
            {clause.name}
          </h3>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            cfg.badge,
          )}
        >
          {cfg.label}
        </span>
      </div>

      <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
        {clause.explanation}
      </p>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="mt-3 flex w-full items-center justify-between gap-2 rounded-md bg-secondary/60 px-3 py-2 text-left text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary"
      >
        <span className="flex items-center gap-1.5">
          <PencilLine className="size-3.5" />
          What to ask them to change
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="mt-2 rounded-md border border-border bg-background/60 p-3">
          <p className="text-[13px] leading-relaxed text-card-foreground">
            {clause.redline}
          </p>
        </div>
      )}
    </div>
  )
}
