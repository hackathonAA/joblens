"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { JobCard } from "@/components/job-card"
import type { JobCard as JobCardType } from "@/lib/kanban-data"
import type { DynamicColumn } from "@/lib/column-presets"
import { cn } from "@/lib/utils"

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

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <h2 className="label-caps text-muted-foreground">{column.title}</h2>
          <span className="font-num inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {cards.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {column.isRejected && (
            <span className="label-caps rounded-sm bg-destructive/10 px-1.5 py-0.5 text-destructive/80">lost</span>
          )}
          {column.isOfferStage && (
            <span className="label-caps rounded-sm bg-[oklch(0.70_0.14_162)]/10 px-1.5 py-0.5 text-[oklch(0.70_0.14_162)]">offer</span>
          )}
        </div>
      </div>

      {/* thin separator */}
      <div className="mb-3 h-px bg-border" />

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 transition-colors rounded-lg",
          isOver && "bg-primary/5 ring-1 ring-inset ring-primary/20",
        )}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <JobCard key={card.id} card={card} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-border/40 text-xs text-muted-foreground/50">
            drop here
          </div>
        )}
      </div>

      {column.isDefault && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="size-3.5" /> Add application
        </button>
      )}
    </div>
  )
}
