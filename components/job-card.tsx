"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock, DollarSign, MapPin, ExternalLink, ChevronDown, ChevronUp, FileText, Pencil, Mail, Sparkles } from "lucide-react"
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

const STATUS_CONFIG: Record<JobCardType["status"], { dot: string; label: string; badge: string }> = {
  active: { dot: "bg-emerald-500", label: "Active", badge: "bg-emerald-500/10 text-emerald-400" },
  waiting: { dot: "bg-amber-500", label: "Waiting", badge: "bg-amber-500/10 text-amber-400" },
  rejected: { dot: "bg-red-500", label: "Rejected", badge: "bg-red-500/10 text-red-400" },
}

function fitBadge(score: number) {
  if (score >= 75) return "bg-emerald-500/15 text-emerald-400"
  if (score >= 50) return "bg-yellow-500/15 text-yellow-400"
  return "bg-red-500/15 text-red-400"
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
  const status = STATUS_CONFIG[card.status]

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
          "group rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
          isDragging && "opacity-40",
          overlay && "cursor-grabbing rotate-2 shadow-xl ring-1 ring-primary/40",
        )}
      >
        {/* Drag handle */}
        <div {...attributes} {...listeners} className="cursor-grab touch-none p-3.5 active:cursor-grabbing">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {getInitials(card.company)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-base font-bold leading-tight text-card-foreground">{card.company}</h3>
                <div className="flex items-center gap-1 mt-1 shrink-0">
                  {card.fitScore != null && (
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", fitBadge(card.fitScore))}>
                      {card.fitScore}% fit
                    </span>
                  )}
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", status.badge)}>
                    {status.label}
                  </span>
                </div>
              </div>
              <p className="truncate text-sm text-muted-foreground">{card.role}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
              <Clock className="size-3" />{daysSince(card.lastActivity)}
            </span>
            {(card.salaryMin > 0 || card.salaryMax > 0) && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                {formatSalary(card.salaryMin, card.salaryMax, currency.symbol)}
              </span>
            )}
            {card.location && (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                <MapPin className="size-3" />{card.location}
              </span>
            )}
          </div>
        </div>

        {/* Expand + Edit controls */}
        {!overlay && (
          <div className="flex items-center border-t border-border/50">
            <button
              type="button"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
              className="flex flex-1 items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground rounded-bl-lg"
            >
              {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {expanded ? "Less" : "Details"}
            </button>
            <div className="w-px h-5 bg-border/50" />
            <button
              type="button"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setEditing(true) }}
              className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground rounded-br-lg"
            >
              <Pencil className="size-3" /> Edit
            </button>
          </div>
        )}

        {/* Expanded details */}
        {expanded && !overlay && (
          <div className="border-t border-border/50 px-3.5 py-3 flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5">Status</p>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", status.badge)}>{status.label}</span>
              </div>
              {card.salaryMin > 0 && (
                <div>
                  <p className="text-muted-foreground mb-0.5">Salary</p>
                  <p className="font-medium text-card-foreground">{formatSalary(card.salaryMin, card.salaryMax, currency.symbol)}</p>
                </div>
              )}
              {card.location && (
                <div>
                  <p className="text-muted-foreground mb-0.5">Location</p>
                  <p className="font-medium text-card-foreground">{card.location}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-0.5">Last activity</p>
                <p className="font-medium text-card-foreground">{daysSince(card.lastActivity)}</p>
              </div>
            </div>

            {card.notes && (
              <div className="flex items-start gap-2 rounded-md bg-secondary/40 px-2.5 py-2">
                <FileText className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
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

            {/* Action buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
              <button
                type="button"
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); setOutreach(true) }}
                className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
              >
                <Mail className="size-3" /> Generate Outreach
              </button>
              <Link
                href={`/jd-analyzer?appId=${card.id}`}
                onPointerDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
              >
                <Sparkles className="size-3" /> {card.fitScore != null ? `Fit: ${card.fitScore}%` : "Analyze JD"}
              </Link>
            </div>

            {!card.notes && !card.jobUrl && !card.location && card.salaryMin === 0 && (
              <p className="text-xs text-muted-foreground italic">No additional details. Click Edit to add more.</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
