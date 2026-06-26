"use client"

import { Clock, MapPin, ExternalLink, FileText, Mail, Sparkles, Pencil } from "lucide-react"
import { type JobCard as JobCardType, daysSince, formatSalary } from "@/lib/kanban-data"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { EditCardModal } from "@/components/edit-card-modal"
import { OutreachModal } from "@/components/outreach-modal"
import Link from "next/link"
import { useCurrency } from "@/lib/currency-context"

function fitColor(score: number) {
  if (score >= 75) return "text-[oklch(0.70_0.14_162)] bg-[oklch(0.70_0.14_162)]/10"
  if (score >= 50) return "text-[oklch(0.78_0.16_75)] bg-[oklch(0.78_0.16_75)]/10"
  return "text-destructive bg-destructive/10"
}

export function CardDetailPanel({
  card,
  onEdit,
}: {
  card: (JobCardType & { location?: string; jobUrl?: string; notes?: string }) | null
  onEdit?: (data: Partial<JobCardType>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [outreach, setOutreach] = useState(false)
  const { currency } = useCurrency()

  if (!card) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Select a card to view details</p>
      </div>
    )
  }

  return (
    <>
      {editing && (
        <EditCardModal
          card={card}
          onClose={() => setEditing(false)}
          onSave={data => { onEdit?.(data); setEditing(false) }}
        />
      )}
      {outreach && (
        <OutreachModal
          applicationId={card.id}
          company={card.company}
          role={card.role}
          onClose={() => setOutreach(false)}
        />
      )}

      <div className="flex flex-col gap-6 p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{card.company}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{card.role}</p>
          </div>
          <div className="flex items-center gap-2">
            {card.fitScore != null && (
              <span className={cn("rounded-lg px-2.5 py-1 font-num text-sm font-semibold", fitColor(card.fitScore))}>
                {card.fitScore}% fit
              </span>
            )}
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Pencil className="size-3" /> Edit
            </button>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4 lg:grid-cols-3">
          <div>
            <p className="label-caps text-muted-foreground mb-1">Last Activity</p>
            <p className="font-num text-sm font-medium text-foreground">{daysSince(card.lastActivity)}</p>
          </div>
          {(card.salaryMin > 0 || card.salaryMax > 0) && (
            <div>
              <p className="label-caps text-muted-foreground mb-1">Salary</p>
              <p className="font-num text-sm font-medium text-foreground">{formatSalary(card.salaryMin, card.salaryMax, currency.symbol)}</p>
            </div>
          )}
          {card.location && (
            <div>
              <p className="label-caps text-muted-foreground mb-1">Location</p>
              <p className="text-sm font-medium text-foreground">{card.location}</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {card.notes && (
          <div>
            <p className="label-caps text-muted-foreground mb-2">Notes</p>
            <div className="flex items-start gap-2 rounded-xl bg-secondary/40 px-4 py-3">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground leading-relaxed">{card.notes}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div>
          <p className="label-caps text-muted-foreground mb-3">Actions</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setOutreach(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors"
            >
              <Mail className="size-3.5" /> Outreach
            </button>
            <Link
              href={`/jd-analyzer?appId=${card.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors"
            >
              <Sparkles className="size-3.5" />
              {card.fitScore != null ? `Fit: ${card.fitScore}%` : "Analyze JD"}
            </Link>
            {card.jobUrl && (
              <a
                href={card.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors"
              >
                <ExternalLink className="size-3.5" /> View posting
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
