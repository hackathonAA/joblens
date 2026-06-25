"use client"

import { useState } from "react"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { X, GripVertical, Plus, Trash2, Check, AlertTriangle, Loader2 } from "lucide-react"
import { useColumns } from "@/lib/columns-context"
import type { DynamicColumn } from "@/lib/column-presets"
import { cn } from "@/lib/utils"

const PRESETS = [
  { value: "tech", label: "Tech Pipeline" },
  { value: "sales", label: "Sales Pipeline" },
  { value: "finance", label: "Finance Pipeline" },
] as const

function SortableRow({
  col,
  onTitleChange,
  onRoleToggle,
  onDelete,
  deleteWarning,
}: {
  col: DynamicColumn & { _title: string }
  onTitleChange: (id: string, title: string) => void
  onRoleToggle: (id: string, role: keyof Pick<DynamicColumn, "isDefault" | "isRejected" | "isInterviewEligible" | "isOfferStage">) => void
  onDelete: (id: string) => void
  deleteWarning?: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-start gap-2 rounded-lg border border-border bg-card p-3", isDragging && "opacity-50 shadow-lg")}
    >
      <button {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
        <GripVertical className="size-4" />
      </button>

      <div className="flex-1 flex flex-col gap-2">
        <input
          value={col._title}
          onChange={e => onTitleChange(col.id, e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex flex-wrap gap-1.5">
          {([
            { key: "isDefault", label: "Default", color: "bg-blue-500/10 text-blue-400 ring-blue-500/20" },
            { key: "isRejected", label: "Lost/Rejected", color: "bg-red-500/10 text-red-400 ring-red-500/20" },
            { key: "isInterviewEligible", label: "Interview stage", color: "bg-purple-500/10 text-purple-400 ring-purple-500/20" },
            { key: "isOfferStage", label: "Offer stage", color: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
          ] as const).map(({ key, label, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => onRoleToggle(col.id, key)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset transition-opacity",
                col[key] ? color : "bg-secondary text-muted-foreground ring-border opacity-50"
              )}
            >
              {col[key] && <Check className="inline size-2.5 mr-0.5" />}{label}
            </button>
          ))}
        </div>
        {deleteWarning && (
          <p className="text-[11px] text-amber-400 flex items-center gap-1">
            <AlertTriangle className="size-3" />{deleteWarning}
          </p>
        )}
      </div>

      <button
        onClick={() => onDelete(col.id)}
        className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-red-400"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

export function ColumnEditorModal({ onClose }: { onClose: () => void }) {
  const { columns, reorderColumns, updateColumn, addColumn, deleteColumn, resetToPreset } = useColumns()
  const [draft, setDraft] = useState<(DynamicColumn & { _title: string })[]>(
    columns.map(c => ({ ...c, _title: c.title }))
  )
  const [newTitle, setNewTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteWarnings, setDeleteWarnings] = useState<Record<string, string>>({})
  const [preset, setPreset] = useState<"" | "tech" | "sales" | "finance">("")

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = draft.findIndex(c => c.id === active.id)
    const newIndex = draft.findIndex(c => c.id === over.id)
    setDraft(prev => arrayMove(prev, oldIndex, newIndex).map((c, i) => ({ ...c, position: i })))
  }

  function handleTitleChange(id: string, title: string) {
    setDraft(prev => prev.map(c => c.id === id ? { ...c, _title: title } : c))
  }

  function handleRoleToggle(id: string, role: keyof Pick<DynamicColumn, "isDefault" | "isRejected" | "isInterviewEligible" | "isOfferStage">) {
    setDraft(prev => prev.map(c => {
      if (c.id !== id) {
        // If setting isDefault, clear it from others
        if (role === "isDefault") return { ...c, isDefault: false }
        return c
      }
      return { ...c, [role]: !c[role] }
    }))
  }

  function handleDelete(id: string) {
    const col = draft.find(c => c.id === id)
    if (!col) return
    if (draft.length <= 1) {
      setDeleteWarnings(prev => ({ ...prev, [id]: "Cannot delete the last column" }))
      return
    }
    if (col.isDefault) {
      setDeleteWarnings(prev => ({ ...prev, [id]: "Cannot delete the default column. Set another as default first." }))
      return
    }
    setDraft(prev => prev.filter(c => c.id !== id).map((c, i) => ({ ...c, position: i })))
  }

  function handleAddColumn() {
    if (!newTitle.trim()) return
    const tempId = `new-${Date.now()}`
    const slug = newTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    setDraft(prev => [...prev, {
      id: tempId,
      columnKey: slug,
      title: newTitle.trim(),
      _title: newTitle.trim(),
      position: prev.length,
      isDefault: false,
      isRejected: false,
      isInterviewEligible: false,
      isOfferStage: false,
    }])
    setNewTitle("")
  }

  async function handlePresetChange(p: "tech" | "sales" | "finance") {
    setPreset(p)
    const { DEFAULT_COLUMNS, SALES_COLUMNS, FINANCE_COLUMNS } = await import("@/lib/column-presets")
    const map = { tech: DEFAULT_COLUMNS, sales: SALES_COLUMNS, finance: FINANCE_COLUMNS }
    const cols = map[p]
    setDraft(cols.map((c, i) => ({ ...c, id: `preset-${i}`, _title: c.title, position: i })))
  }

  async function handleSave() {
    setSaving(true)
    const toSave = draft.map((c, i) => ({
      ...(c.id.startsWith("new-") || c.id.startsWith("preset-") ? {} : { id: c.id }),
      columnKey: c.columnKey,
      title: c._title.trim() || c.title,
      position: i,
      isDefault: c.isDefault,
      isRejected: c.isRejected,
      isInterviewEligible: c.isInterviewEligible,
      isOfferStage: c.isOfferStage,
    }))

    const res = await fetch("/api/columns/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns: toSave }),
    })
    if (res.ok) {
      // Refresh context
      const updated = await res.json()
      await reorderColumns(updated)
      onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Customize Pipeline Columns</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Preset selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Load a preset</label>
            <div className="flex gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePresetChange(p.value)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    preset === p.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset && <p className="mt-1 text-[11px] text-amber-400 flex items-center gap-1"><AlertTriangle className="size-3" />Preset loaded — save to apply. Existing cards will be migrated.</p>}
          </div>

          {/* Column list */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Columns (drag to reorder)</label>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={draft.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {draft.map(col => (
                    <SortableRow
                      key={col.id}
                      col={col}
                      onTitleChange={handleTitleChange}
                      onRoleToggle={handleRoleToggle}
                      onDelete={handleDelete}
                      deleteWarning={deleteWarnings[col.id]}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Add column */}
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddColumn()}
              placeholder="New column name…"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleAddColumn}
              disabled={!newTitle.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-accent disabled:opacity-40"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>

          {/* Role legend */}
          <div className="rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground space-y-1">
            <p><span className="text-blue-400 font-medium">Default</span> — new cards land here</p>
            <p><span className="text-red-400 font-medium">Lost/Rejected</span> — excluded from War Room & Interview tracker</p>
            <p><span className="text-purple-400 font-medium">Interview stage</span> — shows in Interview Logger</p>
            <p><span className="text-emerald-400 font-medium">Offer stage</span> — counted in dashboard offer stats</p>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-5 py-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Save Changes
          </button>
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
