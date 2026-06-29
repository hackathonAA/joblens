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
import { Settings, Archive, RotateCcw, X, AlertTriangle } from "lucide-react"
import { JobCard } from "@/components/job-card"
import { KanbanColumn } from "@/components/kanban-column"
import { AddCardModal } from "@/components/add-card-modal"
import { ColumnEditorModal } from "@/components/column-editor-modal"
import { useColumns } from "@/lib/columns-context"
import type { JobCard as JobCardType } from "@/lib/kanban-data"
import { cn } from "@/lib/utils"

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

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  company,
  destColumn,
  onConfirm,
  onCancel,
}: {
  company: string
  destColumn: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/15">
            <AlertTriangle className="size-4 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-card-foreground">Move from Rejected?</h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-card-foreground">{company}</span> is currently in the Rejected column. Are you sure you want to move it to <span className="font-medium text-card-foreground">{destColumn}</span>?
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Yes, move it
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Archive Drawer ───────────────────────────────────────────────────────────

function ArchiveDrawer({ onClose }: { onClose: () => void }) {
  const [archived, setArchived] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/applications/archive")
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setArchived(data) })
      .finally(() => setLoading(false))
  }, [])

  async function restore(id: string) {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: false }),
    })
    setArchived(prev => prev.filter(a => a.id !== id))
  }

  async function deleteApp(id: string) {
    await fetch(`/api/applications/${id}`, { method: "DELETE" })
    setArchived(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="h-full w-full max-w-md bg-card border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-card-foreground">Archive</h2>
            {archived.length > 0 && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{archived.length}</span>
            )}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <p className="px-5 py-3 text-xs text-muted-foreground border-b border-border">
          Rejected applications older than 15 days are auto-archived. Restore to move them back to your tracker.
        </p>
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}
          {!loading && archived.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Archive className="size-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No archived applications</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Rejected apps auto-archive after 15 days</p>
            </div>
          )}
          {archived.map(app => {
            const archivedDate = app.archivedAt ? new Date(app.archivedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"
            return (
              <div key={app.id} className="rounded-xl border border-border bg-background/60 px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-card-foreground truncate">{app.company}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.role}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Archived {archivedDate}</p>
                  </div>
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400 shrink-0">Archived</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => restore(app.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    <RotateCcw className="size-3" /> Restore
                  </button>
                  <button
                    onClick={() => deleteApp(app.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
                  >
                    <X className="size-3" /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

export function KanbanBoard() {
  const { columns, rejectedColumns, defaultColumn, loading: colsLoading } = useColumns()
  const [cards, setCards] = useState<JobCardType[]>([])
  const [activeCard, setActiveCard] = useState<JobCardType | null>(null)
  const [appsLoading, setAppsLoading] = useState(true)
  const [addingToColumn, setAddingToColumn] = useState<{ key: string; title: string } | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [archiveCount, setArchiveCount] = useState(0)

  // Pending move from rejected: { cardId, destColumnKey, destColumnTitle }
  const [pendingMove, setPendingMove] = useState<{ cardId: string; destColumnKey: string; destColumnTitle: string } | null>(null)

  const rejectedKeys = new Set(rejectedColumns.map(c => c.columnKey))

  useEffect(() => {
    if (colsLoading) return
    fetch("/api/applications")
      .then(r => r.json())
      .then(rows => { if (Array.isArray(rows)) setCards(rows.map(r => dbRowToCard(r, rejectedKeys))) })
      .finally(() => setAppsLoading(false))

    // Auto-archive old rejected apps and get count
    fetch("/api/applications/archive", { method: "POST" }).catch(() => {})
    fetch("/api/applications/archive")
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setArchiveCount(data.length) })
      .catch(() => {})
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
    const destColumnTitle = columns.find(c => c.columnKey === destColumnKey)?.title ?? destColumnKey ?? ""

    if (!destColumnKey || destColumnKey === activeCardData.columnId) return

    // If moving OUT of rejected → ask for confirmation
    if (rejectedKeys.has(activeCardData.columnId) && !rejectedKeys.has(destColumnKey)) {
      setPendingMove({ cardId: activeId, destColumnKey, destColumnTitle })
      return
    }

    await doMove(activeId, destColumnKey, activeCardData)
  }

  async function doMove(cardId: string, destColumnKey: string, cardData: JobCardType) {
    // Remove from war room if moving TO rejected
    if (rejectedKeys.has(destColumnKey)) {
      fetch(`/api/offers?applicationId=${cardId}`)
        .then(r => r.ok ? r.json() : [])
        .then((offers: any[]) => {
          const match = Array.isArray(offers) && offers.find((o: any) => o.applicationId === cardId)
          if (match?.id) fetch(`/api/offers/${match.id}`, { method: "DELETE" })
        })
        .catch(() => {})
    }

    setCards(prev => {
      const moving = prev.find(c => c.id === cardId)
      if (!moving) return prev
      const without = prev.filter(c => c.id !== cardId)
      const updated: JobCardType = {
        ...moving,
        columnId: destColumnKey,
        status: rejectedKeys.has(destColumnKey) ? "rejected" : "active",
      }
      return [...without, updated]
    })

    await fetch(`/api/applications/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: destColumnKey }),
    })
  }

  async function confirmMove() {
    if (!pendingMove) return
    const card = cards.find(c => c.id === pendingMove.cardId)
    if (card) await doMove(pendingMove.cardId, pendingMove.destColumnKey, card)
    setPendingMove(null)
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
      {showArchive && <ArchiveDrawer onClose={() => setShowArchive(false)} />}
      {pendingMove && (
        <ConfirmDialog
          company={cards.find(c => c.id === pendingMove.cardId)?.company ?? ""}
          destColumn={pendingMove.destColumnTitle}
          onConfirm={confirmMove}
          onCancel={() => setPendingMove(null)}
        />
      )}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground/60">Drag cards across stages · Click Details to expand</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchive(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground"
          >
            <Archive className="size-3.5" /> Archive
            {archiveCount > 0 && (
              <span className="rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-semibold">{archiveCount}</span>
            )}
          </button>
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground"
          >
            <Settings className="size-3.5" /> Columns
          </button>
        </div>
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
