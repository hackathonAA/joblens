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
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/40">
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-medium text-muted-foreground">
            {cards.length}
          </span>
        </div>
        {column.isRejected && (
          <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">lost</span>
        )}
        {column.isOfferStage && (
          <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">offer</span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn("flex flex-1 flex-col gap-2.5 px-2 pb-2 transition-colors", isOver && "rounded-lg bg-primary/5")}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <JobCard key={card.id} card={card} onEdit={data => onEdit(card.id, data)} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground">
            Drop here
          </div>
        )}
      </div>

      {/* Only show Add button on the default column */}
      {column.isDefault && (
        <button
          type="button"
          onClick={onAdd}
          className="m-2 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus className="size-4" /> Add application
        </button>
      )}
    </div>
  )
}
