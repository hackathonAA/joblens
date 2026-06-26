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
import { CardDetailPanel } from "@/components/card-detail-panel"
import { AddCardModal } from "@/components/add-card-modal"
import { ColumnEditorModal } from "@/components/column-editor-modal"
import { TwoZone } from "@/components/two-zone"
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

function ColumnSection({
  column,
  cards,
  selectedId,
  onSelect,
  onAdd,
}: {
  column: { columnKey: string; title: string }
  cards: JobCardType[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.columnKey })

  return (
    <section className="px-3 py-2">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="label-caps text-muted-foreground">{column.title}</span>
        <span className="font-num text-[10px] text-muted-foreground">{cards.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-1.5 min-h-[32px] rounded-lg transition-colors",
          isOver && "bg-primary/5 ring-1 ring-inset ring-primary/20",
        )}
      >
        {cards.map(card => (
          <JobCard
            key={card.id}
            card={card}
            selected={selectedId === card.id}
            onSelect={() => onSelect(card.id)}
          />
        ))}
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <Plus className="size-3" /> Add
        </button>
      </div>
    </section>
  )
}

export function KanbanBoard() {
  const { columns, rejectedColumns, loading: colsLoading } = useColumns()
  const [cards, setCards] = useState<JobCardType[]>([])
  const [activeCard, setActiveCard] = useState<JobCardType | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [appsLoading, setAppsLoading] = useState(true)
  const [addingToColumn, setAddingToColumn] = useState<{ key: string; title: string } | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const rejectedKeys = new Set(rejectedColumns.map(c => c.columnKey))

  useEffect(() => {
    if (colsLoading) return
    fetch("/api/applications")
      .then(r => r.json())
      .then(rows => {
        if (Array.isArray(rows)) {
          const mapped = rows.map(r => dbRowToCard(r, rejectedKeys))
          setCards(mapped)
          if (mapped.length > 0) setSelectedId(mapped[0].id)
        }
      })
      .finally(() => setAppsLoading(false))
  }, [colsLoading])

  const loading = colsLoading || appsLoading
  const selectedCard = cards.find(c => c.id === selectedId) ?? null

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
          const match = Array.isArray(offers) && offers.find((o: any) => o.applicationId === activeId || o._raw?.applicationId === activeId)
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
    if (row.id) {
      const newCard = dbRowToCard(row, rejectedKeys)
      setCards(prev => [...prev, newCard])
      setSelectedId(newCard.id)
    }
    setAddingToColumn(null)
  }

  const leftPanel = (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="label-caps text-muted-foreground">Pipeline</span>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Settings className="size-3" /> Columns
        </button>
      </div>
      {loading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        columns.map(column => (
          <ColumnSection
            key={column.columnKey}
            column={column}
            cards={cards.filter(c => c.columnId === column.columnKey)}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={() => setAddingToColumn({ key: column.columnKey, title: column.title })}
          />
        ))
      )}
    </>
  )

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

      <DndContext
        id="joblens-kanban"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <TwoZone left={leftPanel} className="flex-1 min-h-0">
          <CardDetailPanel
            card={selectedCard}
            onEdit={(data) => selectedId && handleEditCard(selectedId, data)}
          />
        </TwoZone>
        <DragOverlay>
          {activeCard ? <JobCard card={activeCard} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </>
  )
}
