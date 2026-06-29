"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { JobCard } from "@/components/job-card"
import type { JobCard as JobCardType } from "@/lib/kanban-data"
import type { DynamicColumn } from "@/lib/column-presets"
import { cn } from "@/lib/utils"

const COLUMN_ACCENT: Record<string, string> = {
  applied:     "border-primary/50 bg-primary/5",
  interviewing:"border-violet-500/50 bg-violet-500/5",
  offer:       "border-emerald-500/50 bg-emerald-500/5",
  rejected:    "border-red-500/40 bg-red-500/5",
}

const COLUMN_HEADER_DOT: Record<string, string> = {
  applied:      "bg-primary",
  interviewing: "bg-violet-500",
  offer:        "bg-emerald-500",
  rejected:     "bg-red-500",
}

export function KanbanColumn({
  column,
  cards,
  onAdd,
  onEdit,
}: {
  column: DynamicColumn
  cards: JobCardType[]
  onAdd: () => void
  onEdit: (id: string, data: Partial<JobCardType>) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.columnKey })

  const accent = COLUMN_ACCENT[column.columnKey] ?? "border-border bg-muted/20"
  const dot = COLUMN_HEADER_DOT[column.columnKey] ?? "bg-muted-foreground"

  return (
    <div className={cn("flex w-72 shrink-0 flex-col rounded-2xl border", accent)}>
      {/* Column header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className={cn("size-2 rounded-full shrink-0", dot)} />
          <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-secondary/80 px-1.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
            {cards.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {column.isRejected && (
            <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">lost</span>
          )}
          {column.isOfferStage && (
            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">offer</span>
          )}
        </div>
      </div>

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 px-2.5 pb-2.5 transition-all duration-150",
          isOver && "bg-primary/8 rounded-xl"
        )}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <JobCard key={card.id} card={card} onEdit={data => onEdit(card.id, data)} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border/50 text-xs text-muted-foreground/50">
            Drop here
          </div>
        )}
      </div>

      {column.isDefault && (
        <button
          type="button"
          onClick={onAdd}
          className="m-2.5 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/8 hover:text-primary"
        >
          <Plus className="size-3.5" /> Add application
        </button>
      )}
    </div>
  )
}
