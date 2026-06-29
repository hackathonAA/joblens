"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock, MapPin, ExternalLink, ChevronDown, ChevronUp, FileText, Pencil, Mail, Sparkles } from "lucide-react"
import {
  type JobCard as JobCardType,
  daysSince,
  formatSalary,
  getInitials,
} from "@/lib/kanban-data"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { EditCardModal } from "@/components/edit-card-modal"
import { OutreachModal } from "@/components/outreach-modal"
import Link from "next/link"
import { useCurrency } from "@/lib/currency-context"

function fitBadgeStyle(score: number) {
  if (score >= 75) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
  if (score >= 50) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
  return "bg-red-500/15 text-red-400 border-red-500/20"
}

const INITIALS_PALETTE = [
  "bg-violet-500/20 text-violet-300",
  "bg-indigo-500/20 text-indigo-300",
  "bg-sky-500/20 text-sky-300",
  "bg-teal-500/20 text-teal-300",
  "bg-amber-500/20 text-amber-300",
  "bg-rose-500/20 text-rose-300",
]

function avatarColor(company: string) {
  const idx = company.charCodeAt(0) % INITIALS_PALETTE.length
  return INITIALS_PALETTE[idx]
}

export function JobCard({
  card,
  overlay = false,
  onEdit,
}: {
  card: JobCardType & { location?: string; jobUrl?: string; notes?: string }
  overlay?: boolean
  onEdit?: (data: Partial<JobCardType>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [outreach, setOutreach] = useState(false)
  const { currency } = useCurrency()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, data: { card } })
  const style = { transform: CSS.Translate.toString(transform), transition }

  return (
    <>
      {editing && !overlay && (
        <EditCardModal
          card={card}
          onClose={() => setEditing(false)}
          onSave={data => { onEdit?.(data); setEditing(false) }}
        />
      )}
      {outreach && !overlay && (
        <OutreachModal
          applicationId={card.id}
          company={card.company}
          role={card.role}
          onClose={() => setOutreach(false)}
        />
      )}

      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group rounded-xl border border-border/70 bg-card transition-all duration-150",
          "hover:border-border hover:shadow-[0_4px_20px_oklch(0_0_0/30%)]",
          isDragging && "opacity-30 scale-95",
          overlay && "cursor-grabbing rotate-1 shadow-2xl ring-1 ring-primary/50 scale-105",
        )}
      >
        {/* Drag handle area */}
        <div {...attributes} {...listeners} className="cursor-grab touch-none px-3.5 pt-3.5 pb-3 active:cursor-grabbing">
          <div className="flex items-start gap-3">
            {/* Company avatar */}
            <div className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
              avatarColor(card.company)
            )}>
              {getInitials(card.company)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-[13px] font-bold leading-tight text-card-foreground">{card.company}</h3>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">{card.role}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {card.fitScore != null && (
                    <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-semibold", fitBadgeStyle(card.fitScore))}>
                      {card.fitScore}%
                    </span>
                  )}
                </div>
              </div>

              {/* Meta chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />{daysSince(card.lastActivity)}
                </span>
                {(card.salaryMin > 0 || card.salaryMax > 0) && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary/60 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {formatSalary(card.salaryMin, card.salaryMax, currency.symbol)}
                  </span>
                )}
                {card.location && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    <MapPin className="size-3" />{card.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        {!overlay && (
          <div className="flex items-center border-t border-border/40 mx-1">
            <button
              type="button"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
              className="flex flex-1 items-center justify-center gap-1 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground rounded-bl-xl"
            >
              {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {expanded ? "Less" : "Details"}
            </button>
            <div className="w-px h-4 bg-border/40" />
            <button
              type="button"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setEditing(true) }}
              className="flex items-center justify-center gap-1 px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground rounded-br-xl"
            >
              <Pencil className="size-3" /> Edit
            </button>
          </div>
        )}

        {/* Expanded panel */}
        {expanded && !overlay && (
          <div className="border-t border-border/40 px-3.5 py-3 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {card.salaryMin > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-0.5">Salary</p>
                  <p className="font-semibold text-card-foreground">{formatSalary(card.salaryMin, card.salaryMax, currency.symbol)}</p>
                </div>
              )}
              {card.location && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-0.5">Location</p>
                  <p className="font-semibold text-card-foreground truncate">{card.location}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-0.5">Last activity</p>
                <p className="font-semibold text-card-foreground">{daysSince(card.lastActivity)}</p>
              </div>
            </div>

            {card.notes && (
              <div className="flex items-start gap-2 rounded-lg bg-secondary/30 border border-border/40 px-2.5 py-2">
                <FileText className="size-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground leading-relaxed">{card.notes}</p>
              </div>
            )}

            {card.jobUrl && (
              <a
                href={card.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="size-3" />View job posting
              </a>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30">
              <button
                type="button"
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); setOutreach(true) }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <Mail className="size-3" /> Outreach
              </button>
              <Link
                href={`/jd-analyzer?appId=${card.id}`}
                onPointerDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 text-[11px] font-medium text-violet-400 hover:bg-violet-500/20 transition-colors"
              >
                <Sparkles className="size-3" /> {card.fitScore != null ? `Fit: ${card.fitScore}%` : "Analyze JD"}
              </Link>
            </div>

            {!card.notes && !card.jobUrl && !card.location && card.salaryMin === 0 && (
              <p className="text-[11px] text-muted-foreground/50 italic">No additional details — click Edit to add.</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
