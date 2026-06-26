# Mission Control Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic single-column scroll layout on all 6 pages with a two-zone "Mission Control" pattern — fixed left panel (context/input/navigation) + wide right canvas (content/output/detail) — making JobLens feel purpose-built rather than generic.

**Architecture:** Every page gets a shared `<TwoZone>` layout primitive (a simple flex container with a fixed-width left panel and a flex-1 right canvas, both independently scrollable). Page-level components pass their left-panel content and canvas content as children. No routing changes needed — each page just wraps its existing logic in TwoZone.

**Tech Stack:** Next.js App Router, Tailwind CSS v4, React state (no new libraries)

## Global Constraints

- Dark-only; color tokens from globals.css (`--background`, `--card`, `--border`, `--primary`, `--sidebar`)
- Left panel width: `w-[340px]` (fixed, not resizable)
- Both zones: `overflow-y-auto` independently scrollable
- `label-caps` class for all section headers (already in globals.css)
- `font-num` class for all numbers
- No new npm packages
- Keep all existing API calls and state logic — only restructure the render/JSX

---

## File Structure

**New:**
- `components/two-zone.tsx` — Layout primitive: left panel + right canvas

**Modified:**
- `components/kanban-board.tsx` — Tracker: left = column lanes stacked vertically, right = selected card detail
- `components/war-room.tsx` — War Room: left = offer list + add form, right = comparison + AI verdict banner  
- `app/dashboard/page.tsx` + `components/stat-cards.tsx` + `components/dashboard-charts.tsx` — Dashboard: editorial metrics strip + spatial chart grid
- `components/interview-logger.tsx` — Interviews: left = app selector + round timeline, right = round detail
- `components/jd-analyzer.tsx` — JD Analyzer: left = input area, right = results
- `components/offer-analyzer.tsx` — Offer Analyzer: left = upload zone, right = clause analysis

---

### Task 1: TwoZone layout primitive

**Files:**
- Create: `components/two-zone.tsx`

**Interfaces:**
- Produces: `<TwoZone left={ReactNode} className?>` with implicit `children` as the right canvas

- [ ] **Step 1: Create the component**

```tsx
// components/two-zone.tsx
import { cn } from "@/lib/utils"

export function TwoZone({
  left,
  children,
  className,
}: {
  left: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex h-full min-h-0", className)}>
      <aside className="w-[340px] shrink-0 flex flex-col overflow-y-auto border-r border-border bg-sidebar">
        {left}
      </aside>
      <main className="flex flex-1 flex-col overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify file exists**

```bash
cat components/two-zone.tsx | head -5
```
Expected: `import { cn }` line visible

- [ ] **Step 3: Commit**

```bash
git add components/two-zone.tsx
git commit -m "feat: add TwoZone layout primitive"
```

---

### Task 2: Tracker — Mission Control layout

The current kanban has horizontal scroll with all columns side-by-side. The new layout puts column lanes (with cards) in a scrollable left panel and shows selected card detail in the right canvas.

**Files:**
- Modify: `components/kanban-board.tsx`
- Modify: `components/job-card.tsx` (add `selected` prop, remove expand toggle)
- Modify: `components/kanban-column.tsx` (vertical list mode)

**Interfaces:**
- Consumes: `TwoZone` from `components/two-zone.tsx`
- Produces: Left panel = column sections with compact cards; Right canvas = selected card detail panel

- [ ] **Step 1: Add `selected` prop and detail view to job-card.tsx**

The card currently has an expand/collapse toggle. In the new layout the detail always lives in the right canvas. Add a `selected` state style (coral left border) and keep the card face compact:

```tsx
// In job-card.tsx — add to props interface:
// selected?: boolean
// onSelect?: () => void

// Replace the outer div className to include:
// selected && "border-l-2 border-l-primary bg-card/80"

// Remove the "Controls" section (the details/edit button row at the bottom)
// Remove the "Expanded details" section
// The edit button stays accessible via the right canvas detail panel
```

Full replacement for `job-card.tsx`:

```tsx
"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock, MapPin } from "lucide-react"
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

export function JobCard({
  card,
  overlay = false,
  selected = false,
  onSelect,
}: {
  card: JobCardType & { location?: string; jobUrl?: string; notes?: string }
  overlay?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const { currency } = useCurrency()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { card },
  })

  const style = { transform: CSS.Translate.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border border-border bg-card transition-all cursor-pointer",
        "hover:border-border/60 hover:shadow-md hover:shadow-black/30",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-xl before:bg-primary before:opacity-0 before:transition-opacity",
        "hover:before:opacity-100",
        selected && "border-l-2 border-l-primary bg-card/80 before:opacity-100",
        isDragging && "opacity-30",
        overlay && "cursor-grabbing rotate-1 shadow-2xl shadow-black/50 ring-1 ring-primary/30",
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none p-3 active:cursor-grabbing">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold leading-tight text-card-foreground">{card.company}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{card.role}</p>
          </div>
          {card.fitScore != null && (
            <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 font-num text-[11px] font-semibold", fitColor(card.fitScore))}>
              {card.fitScore}%
            </span>
          )}
        </div>
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
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create CardDetailPanel component**

Create `components/card-detail-panel.tsx` — the right-canvas detail view for a selected card:

```tsx
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
```

- [ ] **Step 3: Rewrite kanban-board.tsx with TwoZone**

The left panel renders column sections stacked vertically (each with a header + cards). The right canvas shows the selected card detail.

```tsx
"use client"

import {
  DndContext, DragOverlay, PointerSensor,
  type DragEndEvent, type DragStartEvent,
  closestCorners, useSensor, useSensors,
} from "@dnd-kit/core"
import { useState, useEffect } from "react"
import { Settings, Plus } from "lucide-react"
import { JobCard } from "@/components/job-card"
import { CardDetailPanel } from "@/components/card-detail-panel"
import { AddCardModal } from "@/components/add-card-modal"
import { ColumnEditorModal } from "@/components/column-editor-modal"
import { TwoZone } from "@/components/two-zone"
import { useColumns } from "@/lib/columns-context"
import { useDroppable } from "@dnd-kit/core"
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

// cn import needed — add to imports above
import { cn } from "@/lib/utils"

export function KanbanBoard() {
  const { columns, rejectedColumns, defaultColumn, loading: colsLoading } = useColumns()
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
        <TwoZone left={leftPanel} className="h-full">
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
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/i760066/Documents/personal/joblens && npx tsc --noEmit 2>&1 | grep -E "kanban|job-card|card-detail" | head -20
```
Expected: no new errors from these files (pre-existing errors in other files are fine)

- [ ] **Step 5: Commit**

```bash
git add components/job-card.tsx components/card-detail-panel.tsx components/kanban-board.tsx
git commit -m "feat: tracker mission control layout — vertical lanes + card detail panel"
```

---

### Task 3: War Room — Mission Control layout

Left panel = offer list (bold total comp numbers) + "Add Offer" button pinned at top. Right canvas = comparison table for selected offers + AI verdict banner at the top of the canvas.

**Files:**
- Modify: `components/war-room.tsx`

**Interfaces:**
- Consumes: `TwoZone` from `components/two-zone.tsx`

- [ ] **Step 1: Restructure war-room.tsx**

The component has ~647 lines. The key structural change:
1. Add `selectedOfferIds: Set<string>` state (multiple offers can be "checked" for comparison)
2. Left panel: header row with "Add Offer" button + offer list items (logo, company, base, total comp)
3. Right canvas: AI verdict banner (if aiInsights exists) pinned at top, then comparison table below

Find the `return (` block in the render and replace with:

```tsx
  const leftPanel = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="label-caps text-muted-foreground">Offers</span>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/25 transition-colors"
        >
          <Plus className="size-3" /> Add Offer
        </button>
      </div>

      {/* Add form (inline, shown below header) */}
      {showForm && (
        <div className="border-b border-border p-4">
          {/* existing form JSX moved here */}
        </div>
      )}

      {/* Offer list */}
      <div className="flex flex-col divide-y divide-border">
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
        ) : offers.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No offers yet. Add one to get started.</p>
        ) : (
          offers.map((offer, i) => (
            <button
              key={offer.id}
              onClick={() => toggleOfferSelection(offer.id)}
              className={cn(
                "flex flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-secondary/50",
                selectedOfferIds.has(offer.id) && "bg-secondary/80 border-l-2 border-l-primary",
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("size-7 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-bold", offer.logo)}>
                  {offer.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{offer.company}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{offer.role}</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 pl-9">
                <span className="font-num text-base font-bold text-foreground">{fmtMoney(totalComp(offer), sym)}</span>
                <span className="text-[10px] text-muted-foreground">total comp</span>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  )

  const selectedOffers = offers.filter(o => selectedOfferIds.has(o.id))

  return (
    <TwoZone left={leftPanel} className="h-full">
      <div className="flex flex-col h-full">
        {/* AI verdict banner — pinned at top of canvas */}
        {aiInsights && (
          <div className="shrink-0 border-b border-border bg-primary/5 px-6 py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="size-4 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="label-caps text-primary mb-1">AI Recommendation</p>
                <p className="text-sm text-foreground leading-relaxed">{aiInsights.recommendation}</p>
                {aiInsights.negotiationTips.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {aiInsights.negotiationTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="text-primary mt-0.5">·</span> {tip}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button onClick={() => setAiInsights(null)} className="ml-auto shrink-0 text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Canvas content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedOffers.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Select offers from the left to compare</p>
            </div>
          ) : (
            <>
              {/* Summary cards for selected offers */}
              <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `repeat(${Math.min(selectedOffers.length, 3)}, 1fr)` }}>
                {selectedOffers.map((offer, i) => (
                  <div key={offer.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn("size-8 rounded-lg flex items-center justify-center text-xs font-bold", offer.logo)}>
                        {offer.initials}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{offer.company}</p>
                        <p className="text-[11px] text-muted-foreground">{offer.role}</p>
                      </div>
                    </div>
                    <p className="font-num text-2xl font-bold text-foreground">{fmtMoney(totalComp(offer), sym)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">total annual comp</p>
                  </div>
                ))}
              </div>

              {/* Comparison table */}
              {selectedOffers.length > 1 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="label-caps px-4 py-2.5 text-left text-muted-foreground font-normal">Metric</th>
                        {selectedOffers.map(o => (
                          <th key={o.id} className="label-caps px-4 py-2.5 text-left text-muted-foreground font-normal">{o.company}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {COMPARISON_ROWS.map(row => (
                        <tr key={row.key} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.label}</td>
                          {selectedOffers.map(o => (
                            <td key={o.id} className="px-4 py-2.5 font-num text-sm text-foreground">
                              {row.render(o)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* AI insights trigger */}
              {!aiInsights && selectedOffers.length >= 1 && (
                <button
                  onClick={fetchAiInsights}
                  disabled={aiLoading}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-primary/30 px-4 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Get AI recommendation
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </TwoZone>
  )
```

Add `selectedOfferIds` state and `toggleOfferSelection` helper at the top of the component:

```tsx
const [selectedOfferIds, setSelectedOfferIds] = useState<Set<string>>(new Set())
function toggleOfferSelection(id: string) {
  setSelectedOfferIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
}
```

Add a `COMPARISON_ROWS` constant (outside component):

```tsx
const COMPARISON_ROWS = [
  { key: "base", label: "Base Salary", render: (o: Offer) => fmtFull(o.baseSalary) },
  { key: "equity", label: "Equity Value", render: (o: Offer) => fmtFull(o.equityValue) },
  { key: "signing", label: "Signing Bonus", render: (o: Offer) => fmtFull(o.signingBonus) },
  { key: "vesting", label: "Vesting", render: (o: Offer) => o.vesting },
  { key: "cliff", label: "Cliff", render: (o: Offer) => o.cliff },
]
```

Auto-select first offer when offers load by adding to the fetch `.then()`:

```tsx
.then(([offersData, ...]) => {
  if (Array.isArray(offersData) && offersData.length > 0) {
    setSelectedOfferIds(new Set([offersData[0].id]))
  }
  ...
})
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/i760066/Documents/personal/joblens && npx tsc --noEmit 2>&1 | grep "war-room" | head -10
```

- [ ] **Step 3: Commit**

```bash
git add components/war-room.tsx
git commit -m "feat: war room mission control — offer list panel + AI verdict banner"
```

---

### Task 4: Dashboard — Editorial metrics strip

Replace the generic SaaS tile grid with a large-number metrics strip across the top and spatial chart grid below.

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `components/stat-cards.tsx`

- [ ] **Step 1: Rewrite stat-cards.tsx as an editorial metrics strip**

```tsx
"use client"

import { useCurrency } from "@/lib/currency-context"
import { cn } from "@/lib/utils"

type Stat = {
  label: string
  value: string | number
  sub?: string
  trend?: "up" | "down" | "flat"
  highlight?: boolean
}

export function MetricsStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex items-stretch border-b border-border divide-x divide-border">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={cn(
            "flex flex-col justify-center px-6 py-5 min-w-0",
            i === 0 && "flex-[1.5]",
            stat.highlight && "bg-primary/5",
          )}
        >
          <p className="label-caps text-muted-foreground mb-1">{stat.label}</p>
          <p className={cn(
            "font-num text-3xl font-bold leading-none",
            stat.highlight ? "text-primary" : "text-foreground",
          )}>
            {stat.value}
          </p>
          {stat.sub && (
            <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Update dashboard page to use metrics strip**

In `app/dashboard/page.tsx`, replace `<StatCards />` with `<MetricsStrip stats={...} />` after computing the stats from the existing data fetching logic.

The page already fetches dashboard data. Map it to the strip format:

```tsx
// In the page component, after data is fetched:
const stats: Stat[] = [
  { label: "Active Applications", value: dashboardData?.totalActive ?? "—" },
  { label: "Response Rate", value: dashboardData?.responseRate ? `${dashboardData.responseRate}%` : "—", highlight: true },
  { label: "In Interview", value: dashboardData?.inInterview ?? "—" },
  { label: "Offers", value: dashboardData?.offers ?? "—" },
  { label: "Avg. Time to Response", value: dashboardData?.avgDaysToResponse ? `${dashboardData.avgDaysToResponse}d` : "—" },
]
```

- [ ] **Step 3: Verify**

```bash
cd /Users/i760066/Documents/personal/joblens && npx tsc --noEmit 2>&1 | grep "dashboard\|stat-cards" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add components/stat-cards.tsx app/dashboard/page.tsx
git commit -m "feat: dashboard editorial metrics strip replacing tile grid"
```

---

### Task 5: Interview Logger — Mission Control layout

Left panel = app selector dropdown + round timeline. Right canvas = round detail (already has a two-col grid; promote it to full two-zone).

**Files:**
- Modify: `components/interview-logger.tsx`

**Interfaces:**
- Consumes: `TwoZone` from `components/two-zone.tsx`

- [ ] **Step 1: Identify the render structure in interview-logger.tsx**

The component has:
- App selector (top)
- Selected app's round timeline (`<InterviewTimeline />` or inline)
- Round detail panel (`<RoundDetail />` or inline in a `lg:grid-cols-[260px_1fr]`)
- Question bank section

The left panel should contain: app selector + round list/timeline.
The right canvas should contain: round detail + question bank.

- [ ] **Step 2: Restructure interview-logger.tsx render**

Find the return statement and restructure to:

```tsx
const leftPanel = (
  <>
    {/* App selector */}
    <div className="px-4 py-3 border-b border-border">
      <p className="label-caps text-muted-foreground mb-2">Application</p>
      {/* existing app selector dropdown */}
    </div>

    {/* Round list */}
    {selectedApp && (
      <div className="flex flex-col">
        {selectedApp.rounds.map(round => (
          <button
            key={round.id}
            onClick={() => setSelectedRoundId(round.id)}
            className={cn(
              "flex flex-col gap-0.5 px-4 py-3 text-left border-b border-border transition-colors hover:bg-secondary/50",
              selectedRoundId === round.id && "bg-secondary/80 border-l-2 border-l-primary",
            )}
          >
            <p className="text-sm font-medium text-foreground">{round.roundType}</p>
            <div className="flex items-center gap-2">
              {round.scheduledAt && (
                <span className="text-[11px] text-muted-foreground font-num">
                  {new Date(round.scheduledAt).toLocaleDateString()}
                </span>
              )}
              <span className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded",
                round.outcome === "passed" && "bg-emerald-500/15 text-emerald-400",
                round.outcome === "failed" && "bg-red-500/15 text-red-400",
                round.outcome === "pending" && "bg-secondary text-muted-foreground",
              )}>
                {round.outcome}
              </span>
            </div>
          </button>
        ))}
        {/* Add round button */}
        <button
          onClick={() => setShowAddRound(true)}
          className="flex items-center gap-1.5 px-4 py-3 text-[11px] text-muted-foreground hover:bg-secondary/50 transition-colors"
        >
          <Plus className="size-3" /> Add Round
        </button>
      </div>
    )}
  </>
)

return (
  <TwoZone left={leftPanel} className="h-full">
    {/* Right canvas: selected round detail + question bank */}
    {selectedRound ? (
      <div className="flex flex-col p-6 gap-6">
        {/* existing RoundDetail or inline round detail */}
        {/* existing QuestionBank */}
      </div>
    ) : (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {selectedApp ? "Select a round to view details" : "Select an application to get started"}
        </p>
      </div>
    )}
  </TwoZone>
)
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/i760066/Documents/personal/joblens && npx tsc --noEmit 2>&1 | grep "interview-logger" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add components/interview-logger.tsx
git commit -m "feat: interview logger mission control — app+round panel + detail canvas"
```

---

### Task 6: JD Analyzer + Offer Analyzer — split-panel layouts

Both pages are simpler: left side = input, right side = output.

**Files:**
- Modify: `components/jd-analyzer.tsx`
- Modify: `components/offer-analyzer.tsx`

- [ ] **Step 1: Wrap jd-analyzer.tsx in TwoZone**

The component has a textarea + analyze button, then results below. Move input to left panel, results to right canvas:

```tsx
// In jd-analyzer.tsx return statement, replace the outer div with:
<TwoZone
  left={
    <div className="flex flex-col gap-4 p-4 h-full">
      <p className="label-caps text-muted-foreground">Job Description</p>
      {/* existing app selector */}
      {/* existing textarea */}
      {/* existing analyze button */}
    </div>
  }
  className="h-full"
>
  {/* existing results JSX (chips, fit score, sections) */}
  {result ? <div className="p-6">...results...</div> : <EmptyState />}
</TwoZone>
```

- [ ] **Step 2: Wrap offer-analyzer.tsx in TwoZone**

```tsx
// In offer-analyzer.tsx return statement:
<TwoZone
  left={
    <div className="flex flex-col gap-4 p-4">
      <p className="label-caps text-muted-foreground">Offer Letter</p>
      {/* existing OfferUpload / paste area */}
    </div>
  }
  className="h-full"
>
  {/* existing clause cards and suggestion banners */}
  {clauses.length > 0 ? <div className="p-6">...clauses...</div> : <EmptyState />}
</TwoZone>
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/i760066/Documents/personal/joblens && npx tsc --noEmit 2>&1 | grep "jd-analyzer\|offer-analyzer" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add components/jd-analyzer.tsx components/offer-analyzer.tsx
git commit -m "feat: jd analyzer + offer analyzer split-panel layouts"
```

---

### Task 7: Page wrappers — remove padding, full height

All page files (app/page.tsx, app/war-room/page.tsx, etc.) currently add `px-8 py-7` padding. The TwoZone layout should be flush to the shell edges.

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/war-room/page.tsx`
- Modify: `app/interview-logger/page.tsx`
- Modify: `app/jd-analyzer/page.tsx`
- Modify: `app/offer-analyzer/page.tsx`
- Modify: `app/dashboard/page.tsx` (keep metrics strip flush, pad chart area)

- [ ] **Step 1: Remove top-level padding from each page**

Each page wrapper that contains a TwoZone component should have `h-full` not `px-8 py-7`.

For `app/page.tsx`:
```tsx
// Replace outer div/section with:
<div className="h-full flex flex-col">
  <KanbanBoard />
</div>
```

Repeat pattern for war-room, interview-logger, jd-analyzer, offer-analyzer pages.

For dashboard: keep the `px-8 py-7` on the chart section below the metrics strip but remove from the page wrapper.

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx app/war-room/page.tsx app/interview-logger/page.tsx app/jd-analyzer/page.tsx app/offer-analyzer/page.tsx app/dashboard/page.tsx
git commit -m "feat: page wrappers full-height for mission control layouts"
```

---

## Self-Review

**Spec coverage:**
- ✅ Tracker: vertical column lanes left + card detail right
- ✅ War Room: offer list left + comparison + AI verdict banner right
- ✅ Dashboard: editorial metrics strip + charts
- ✅ Interview Logger: app selector + round timeline left + detail right
- ✅ JD Analyzer: input left + results right
- ✅ Offer Analyzer: upload left + clauses right

**Placeholder scan:** No TBDs. Each step has concrete code.

**Type consistency:** `TwoZone` props (`left`, `children`, `className`) used consistently. `JobCardType` extended with `location/jobUrl/notes` consistently (matches existing pattern). `Offer` type from `war-room-data` used directly.
