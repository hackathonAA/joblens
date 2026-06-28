"use client"

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  pointerWithin,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core"
import { useState, useEffect } from "react"
import { Settings, Plus } from "lucide-react"
import { JobCard } from "@/components/job-card"
import { AddCardModal } from "@/components/add-card-modal"
import { ColumnEditorModal } from "@/components/column-editor-modal"
import { PageLoader } from "@/components/page-loader"
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
    <section className="border-b border-border last:border-0 shadow-[0_1px_0_0_oklch(1_0_0/6%),0_4px_12px_0_oklch(0_0_0/40%)]">
      {/* Stage header */}
      <div className={cn(
        "flex items-center justify-between px-8 py-3 border-l-2",
        column.isRejected
          ? "border-l-destructive/60 bg-destructive/3"
          : column.isOfferStage
            ? "border-l-[oklch(0.72_0.17_145)] bg-[oklch(0.72_0.17_145)]/3"
            : "border-l-primary/50 bg-primary/2"
      )}>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {column.title}
          </span>
          <span className={cn(
            "font-num text-[10px] font-bold px-1.5 py-0.5 border",
            cards.length > 0
              ? column.isRejected
                ? "border-destructive/40 text-destructive/70 bg-destructive/5"
                : column.isOfferStage
                  ? "border-[oklch(0.72_0.17_145)]/40 text-[oklch(0.72_0.17_145)] bg-[oklch(0.72_0.17_145)]/5"
                  : "border-primary/40 text-primary bg-primary/5"
              : "border-border text-muted-foreground/40 bg-transparent"
          )}>
            {cards.length}
          </span>
          {column.isOfferStage && cards.length > 0 && (
            <span className="text-[9px] font-bold text-[oklch(0.72_0.17_145)] uppercase tracking-widest">
              ▲ OFFER
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-dashed border-border hover:border-primary/60"
        >
          <Plus className="size-3" /> ADD
        </button>
      </div>

      {/* Cards grid + drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "grid gap-2 px-8 py-5 transition-colors bg-[oklch(0.085_0_0)]",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          isOver && (column.isRejected ? "!bg-destructive/5" : "!bg-[oklch(0.72_0.17_145)]/5"),
        )}
      >
        {cards.length === 0 ? (
          <div className={cn(
            "col-span-full flex items-center justify-center border border-dashed py-6 transition-colors",
            isOver
              ? column.isRejected
                ? "border-destructive/40 bg-destructive/5"
                : "border-[oklch(0.72_0.17_145)]/40 bg-[oklch(0.72_0.17_145)]/5"
              : "border-border/40",
          )}>
            <p className="text-[10px] text-muted-foreground/40 tracking-widest uppercase">drop here · or add above</p>
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

    // Only column drop zones are valid targets (useDroppable ids = columnKey)
    const destColumnKey = columns.find(col => col.columnKey === overId)?.columnKey
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

    setCards(prev => prev.map(c => c.id === activeId
      ? { ...c, columnId: destColumnKey, status: rejectedKeys.has(destColumnKey) ? "rejected" : "active" }
      : c
    ))

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

      {/* Sticky header + pipeline strip */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center justify-between px-8 pt-5 pb-3">
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-foreground">// TRACKER</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">pipeline · {cards.length} applications</p>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground border border-border"
          >
            <Settings className="size-3.5" /> COLUMNS
          </button>
        </div>

        {/* Pipeline summary strip */}
        {!loading && (
          <div className="flex flex-wrap items-stretch border-t border-border">
            {columns.map((col) => {
              const count = cards.filter(c => c.columnId === col.columnKey).length
              return (
                <a key={col.columnKey} href={`#stage-${col.columnKey}`} className="group flex flex-col items-center gap-0.5 px-4 py-2 hover:bg-secondary transition-colors min-w-[72px] border-r border-border last:border-r-0">
                  <span className={cn(
                    "font-num text-base font-bold leading-none",
                    count > 0 ? "text-primary" : "text-muted-foreground/30"
                  )}>{count}</span>
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 text-center leading-tight">{col.title}</span>
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* Stages */}
      <DndContext
        id="joblens-kanban"
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {loading ? (
          <PageLoader />
        ) : (
          columns.map(column => (
            <div id={`stage-${column.columnKey}`} key={column.columnKey} style={{ scrollMarginTop: "96px" }}>
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
