"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock, MapPin, ExternalLink, ChevronDown, ChevronUp, Pencil, Check, X } from "lucide-react"
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

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/60"
      />
    </div>
  )
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
  const { currency } = useCurrency()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    company: card.company,
    role: card.role,
    location: card.location ?? "",
    notes: card.notes ?? "",
    jobUrl: card.jobUrl ?? "",
    salaryMin: String(card.salaryMin ?? ""),
    salaryMax: String(card.salaryMax ?? ""),
  })

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { card },
  })

  const style = { transform: CSS.Translate.toString(transform), transition }

  function saveEdit() {
    onEdit?.({
      company: draft.company,
      role: draft.role,
      location: draft.location || undefined,
      notes: draft.notes || undefined,
      jobUrl: draft.jobUrl || undefined,
      salaryMin: parseInt(draft.salaryMin) || 0,
      salaryMax: parseInt(draft.salaryMax) || 0,
    })
    setEditing(false)
  }

  function cancelEdit() {
    setDraft({
      company: card.company,
      role: card.role,
      location: card.location ?? "",
      notes: card.notes ?? "",
      jobUrl: card.jobUrl ?? "",
      salaryMin: String(card.salaryMin ?? ""),
      salaryMax: String(card.salaryMax ?? ""),
    })
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border border-border bg-card transition-all",
        "hover:border-border/60 hover:shadow-md hover:shadow-black/30",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-xl before:bg-primary before:opacity-0 before:transition-opacity",
        "hover:before:opacity-100",
        isDragging && "opacity-30",
        overlay && "cursor-grabbing rotate-1 shadow-2xl shadow-black/50 ring-1 ring-primary/30",
      )}
    >
      {/* Drag handle + main info */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none p-3 active:cursor-grabbing"
        onClick={() => !editing && setExpanded(v => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                <EditField label="Company" value={draft.company} onChange={v => setDraft(d => ({ ...d, company: v }))} />
                <EditField label="Role" value={draft.role} onChange={v => setDraft(d => ({ ...d, role: v }))} />
              </div>
            ) : (
              <>
                <h3 className="truncate text-sm font-bold leading-tight text-card-foreground">{card.company}</h3>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{card.role}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {card.fitScore != null && !editing && (
              <span className={cn("rounded-md px-1.5 py-0.5 font-num text-[11px] font-semibold", fitColor(card.fitScore))}>
                {card.fitScore}%
              </span>
            )}
            {!overlay && (
              <button
                onClick={e => { e.stopPropagation(); editing ? saveEdit() : setEditing(true) }}
                className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-secondary transition-all"
              >
                {editing ? <Check className="size-3" /> : <Pencil className="size-3" />}
              </button>
            )}
            {editing && (
              <button
                onClick={e => { e.stopPropagation(); cancelEdit() }}
                className="rounded p-1 text-muted-foreground hover:text-red-400 hover:bg-secondary transition-all"
              >
                <X className="size-3" />
              </button>
            )}
            {!editing && !overlay && (
              <ChevronDown className={cn("size-3 text-muted-foreground transition-transform", expanded && "rotate-180")} />
            )}
          </div>
        </div>

        {/* Tags row */}
        {!editing && (
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
        )}
      </div>

      {/* Editing — additional fields */}
      {editing && (
        <div className="border-t border-border px-3 pb-3 pt-2 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
          <div className="grid grid-cols-2 gap-2">
            <EditField label={`Salary Min (${currency.symbol})`} value={draft.salaryMin} onChange={v => setDraft(d => ({ ...d, salaryMin: v }))} />
            <EditField label={`Salary Max (${currency.symbol})`} value={draft.salaryMax} onChange={v => setDraft(d => ({ ...d, salaryMax: v }))} />
          </div>
          <EditField label="Location" value={draft.location} onChange={v => setDraft(d => ({ ...d, location: v }))} />
          <EditField label="Job URL" value={draft.jobUrl} onChange={v => setDraft(d => ({ ...d, jobUrl: v }))} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Notes</label>
            <textarea
              value={draft.notes}
              onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
              rows={2}
              className="resize-none rounded-lg border border-border bg-background/60 px-2 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveEdit} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
              <Check className="size-3" /> Save
            </button>
            <button onClick={cancelEdit} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expanded details */}
      {expanded && !editing && (
        <div className="border-t border-border px-3 pb-3 pt-2 flex flex-col gap-2">
          {card.notes && (
            <p className="text-[12px] text-muted-foreground leading-relaxed">{card.notes}</p>
          )}
          {card.jobUrl && (
            <a
              href={card.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline"
            >
              <ExternalLink className="size-3" /> View job posting
            </a>
          )}
          {!card.notes && !card.jobUrl && (
            <p className="text-[11px] text-muted-foreground/50 italic">No details yet. Click the edit button to add notes.</p>
          )}
        </div>
      )}
    </div>
  )
}
