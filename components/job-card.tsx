"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock, MapPin } from "lucide-react"
import {
  type JobCard as JobCardType,
  daysSince,
  formatSalary,
} from "@/lib/kanban-data"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/lib/currency-context"

function fitColor(score: number) {
  if (score >= 75) return "text-[oklch(0.70_0.14_162)] bg-[oklch(0.70_0.14_162)]/10"
  if (score >= 50) return "text-[oklch(0.78_0.16_75)] bg-[oklch(0.78_0.16_75)]/10"
  return "text-destructive bg-destructive/10"
}

export function JobCard({
  card,
  overlay = false,
  selected = false,
  onSelect,
}: {
  card: JobCardType & { location?: string; jobUrl?: string; notes?: string }
  overlay?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const { currency } = useCurrency()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { card },
  })

  const style = { transform: CSS.Translate.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border border-border bg-card transition-all cursor-pointer",
        "hover:border-border/60 hover:shadow-md hover:shadow-black/30",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-xl before:bg-primary before:opacity-0 before:transition-opacity",
        "hover:before:opacity-100",
        selected && "border-l-2 border-l-primary bg-card/80 before:opacity-100",
        isDragging && "opacity-30",
        overlay && "cursor-grabbing rotate-1 shadow-2xl shadow-black/50 ring-1 ring-primary/30",
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none p-3 active:cursor-grabbing">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold leading-tight text-card-foreground">{card.company}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{card.role}</p>
          </div>
          {card.fitScore != null && (
            <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 font-num text-[11px] font-semibold", fitColor(card.fitScore))}>
              {card.fitScore}%
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 font-num text-[10px] text-muted-foreground">
            <Clock className="size-2.5" />{daysSince(card.lastActivity)}
          </span>
          {(card.salaryMin > 0 || card.salaryMax > 0) && (
            <span className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 font-num text-[10px] text-muted-foreground">
              {formatSalary(card.salaryMin, card.salaryMax, currency.symbol)}
            </span>
          )}
          {card.location && (
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <MapPin className="size-2.5" />{card.location}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
