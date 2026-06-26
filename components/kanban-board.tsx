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
} from "@dnd-kit/core"
import { useState, useEffect } from "react"
import { Settings } from "lucide-react"
import { JobCard } from "@/components/job-card"
import { KanbanColumn } from "@/components/kanban-column"
import { AddCardModal } from "@/components/add-card-modal"
import { ColumnEditorModal } from "@/components/column-editor-modal"
import { useColumns } from "@/lib/columns-context"
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

export function KanbanBoard() {
  const { columns, rejectedColumns, defaultColumn, loading: colsLoading } = useColumns()
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
      .then(rows => { if (Array.isArray(rows)) setCards(rows.map(r => dbRowToCard(r, rejectedKeys))) })
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

    // If moving to rejected column, remove from war room if offer exists
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

      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Settings className="size-3.5" /> Customize columns
        </button>
      </div>

      <DndContext
        id="joblens-kanban"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {loading ? (
            <p className="text-muted-foreground text-sm py-8">Loading…</p>
          ) : (
            columns.map(column => (
              <KanbanColumn
                key={column.columnKey}
                column={column}
                cards={cards.filter(c => c.columnId === column.columnKey)}
                onAdd={() => setAddingToColumn({ key: column.columnKey, title: column.title })}
                onEdit={handleEditCard}
              />
            ))
          )}
        </div>
        <DragOverlay>
          {activeCard ? <JobCard card={activeCard} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </>
  )
}
