"use client"

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core"
import { useState, useEffect } from "react"
import { Settings, Plus } from "lucide-react"
import { JobCard } from "@/components/job-card"
import { AddCardModal } from "@/components/add-card-modal"
import { ColumnEditorModal } from "@/components/column-editor-modal"
import { useColumns } from "@/lib/columns-context"
import { cn } from "@/lib/utils"
import type { JobCard as JobCardType } from "@/lib/kanban-data"

function dbRowToCard(row: any, rejectedKeys: Set<string>): JobCardType {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    lastActivity: row.updatedAt ?? row.appliedAt ?? new Date().toISOString(),
    salaryMin: row.salaryMin ?? 0,
    salaryMax: row.salaryMax ?? 0,
    status: rejectedKeys.has(row.status) ? "rejected" : "active",
    columnId: row.status ?? "applied",
    location: row.location ?? undefined,
    jobUrl: row.jobUrl ?? undefined,
    notes: row.notes ?? undefined,
    fitScore: row.fitScore ?? undefined,
  }
}

function StageSection({
  column,
  cards,
  onAdd,
  onEdit,
}: {
  column: { columnKey: string; title: string; isRejected?: boolean; isOfferStage?: boolean }
  cards: JobCardType[]
  onAdd: () => void
  onEdit: (id: string, data: Partial<JobCardType>) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.columnKey })

  return (
    <section className="py-8 border-b border-border/40 last:border-0">
      {/* Stage header */}
      <div className="flex items-center justify-between mb-5 px-8">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {column.title}
          </h2>
          <span className={cn(
            "font-num text-xs font-bold rounded-full px-2 py-0.5",
            cards.length > 0
              ? column.isRejected
                ? "bg-destructive/10 text-destructive/70"
                : column.isOfferStage
                  ? "bg-[oklch(0.70_0.14_162)]/10 text-[oklch(0.70_0.14_162)]"
                  : "bg-primary/10 text-primary"
              : "bg-secondary text-muted-foreground/50"
          )}>
            {cards.length}
          </span>
          {column.isOfferStage && cards.length > 0 && (
            <span className="text-[10px] font-medium text-[oklch(0.70_0.14_162)] uppercase tracking-wide">
              · offer stage
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-dashed border-border/50 hover:border-primary/40"
        >
          <Plus className="size-3" /> Add
        </button>
      </div>

      {/* Cards grid + drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "grid gap-3 px-8 transition-colors",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          isOver && "bg-primary/3 rounded-xl",
        )}
      >
        {cards.length === 0 ? (
          <div className={cn(
            "col-span-full flex items-center justify-center rounded-xl border border-dashed py-8 transition-colors",
            isOver ? "border-primary/40 bg-primary/5" : "border-border/30",
          )}>
            <p className="text-xs text-muted-foreground/50">drop here or add above</p>
          </div>
        ) : (
          cards.map(card => (
            <JobCard key={card.id} card={card} onEdit={data => onEdit(card.id, data)} />
          ))
        )}
      </div>
    </section>
  )
}

export function KanbanBoard() {
  const { columns, rejectedColumns, loading: colsLoading } = useColumns()
  const [cards, setCards] = useState<JobCardType[]>([])
  const [activeCard, setActiveCard] = useState<JobCardType | null>(null)
  const [appsLoading, setAppsLoading] = useState(true)
  const [addingToColumn, setAddingToColumn] = useState<{ key: string; title: string } | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const rejectedKeys = new Set(rejectedColumns.map(c => c.columnKey))

  useEffect(() => {
    if (colsLoading) return
    fetch("/api/applications")
      .then(r => r.json())
      .then(rows => {
        if (Array.isArray(rows)) setCards(rows.map(r => dbRowToCard(r, rejectedKeys)))
      })
      .finally(() => setAppsLoading(false))
  }, [colsLoading])

  const loading = colsLoading || appsLoading

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragStart(event: DragStartEvent) {
    setActiveCard(cards.find(c => c.id === event.active.id) ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeCardData = cards.find(c => c.id === activeId)
    if (!activeCardData) return

    const overColumn = columns.find(col => col.columnKey === overId)
    const overCard = cards.find(c => c.id === overId)
    const destColumnKey: string | undefined = overColumn?.columnKey ?? overCard?.columnId

    if (!destColumnKey || destColumnKey === activeCardData.columnId) return

    if (rejectedKeys.has(destColumnKey)) {
      fetch(`/api/offers?applicationId=${activeId}`)
        .then(r => r.ok ? r.json() : [])
        .then((offers: any[]) => {
          const match = Array.isArray(offers) && offers.find((o: any) => o.applicationId === activeId)
          if (match?.id) fetch(`/api/offers/${match.id}`, { method: "DELETE" })
        })
        .catch(() => {})
    }

    setCards(prev => {
      const moving = prev.find(c => c.id === activeId)
      if (!moving) return prev
      const without = prev.filter(c => c.id !== activeId)
      const updated: JobCardType = {
        ...moving,
        columnId: destColumnKey,
        status: rejectedKeys.has(destColumnKey) ? "rejected" : "active",
      }
      if (overCard && overCard.columnId === destColumnKey) {
        const index = without.findIndex(c => c.id === overId)
        return [...without.slice(0, index), updated, ...without.slice(index)]
      }
      return [...without, updated]
    })

    await fetch(`/api/applications/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: destColumnKey }),
    })
  }

  async function handleEditCard(id: string, data: Partial<JobCardType>) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }

  async function handleSaveCard(data: { company: string; role: string; salaryMin: number; salaryMax: number; notes: string; location: string; jobUrl: string }) {
    if (!addingToColumn) return
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status: addingToColumn.key }),
    })
    const row = await res.json()
    if (row.id) setCards(prev => [...prev, dbRowToCard(row, rejectedKeys)])
    setAddingToColumn(null)
  }

  return (
    <>
      {addingToColumn && (
        <AddCardModal
          columnKey={addingToColumn.key}
          columnTitle={addingToColumn.title}
          onClose={() => setAddingToColumn(null)}
          onSave={handleSaveCard}
        />
      )}
      {showEditor && <ColumnEditorModal onClose={() => setShowEditor(false)} />}

      {/* Page header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tracker</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Your pipeline at a glance.</p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Settings className="size-3.5" /> Columns
        </button>
      </div>

      {/* Pipeline summary strip */}
      {!loading && (
        <div className="flex items-stretch gap-0 px-8 py-4 overflow-x-auto">
          {columns.map((col, i) => {
            const count = cards.filter(c => c.columnId === col.columnKey).length
            return (
              <a key={col.columnKey} href={`#stage-${col.columnKey}`} className="group flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-secondary/50 transition-colors min-w-[80px]">
                <span className={cn(
                  "font-num text-lg font-bold leading-none",
                  count > 0 ? "text-foreground" : "text-muted-foreground/30"
                )}>{count}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60 text-center leading-tight">{col.title}</span>
              </a>
            )
          })}
        </div>
      )}

      <div className="h-px bg-border/30 mx-8" />

      {/* Stages */}
      <DndContext
        id="joblens-kanban"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {loading ? (
          <p className="text-sm text-muted-foreground px-8 py-12">Loading…</p>
        ) : (
          columns.map(column => (
            <div id={`stage-${column.columnKey}`} key={column.columnKey}>
              <StageSection
                column={column}
                cards={cards.filter(c => c.columnId === column.columnKey)}
                onAdd={() => setAddingToColumn({ key: column.columnKey, title: column.title })}
                onEdit={handleEditCard}
              />
            </div>
          ))
        )}
        <DragOverlay>
          {activeCard ? <JobCard card={activeCard} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </>
  )
}
