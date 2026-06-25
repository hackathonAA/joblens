"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { DynamicColumn } from "@/lib/column-presets"

type ColumnsContextValue = {
  columns: DynamicColumn[]
  loading: boolean
  defaultColumn: DynamicColumn | undefined
  rejectedColumns: DynamicColumn[]
  interviewEligibleColumns: DynamicColumn[]
  offerStageColumns: DynamicColumn[]
  addColumn: (col: Partial<DynamicColumn> & { title: string }) => Promise<void>
  updateColumn: (id: string, patch: Partial<DynamicColumn>) => Promise<void>
  deleteColumn: (id: string, force?: boolean) => Promise<{ error?: string; count?: number }>
  reorderColumns: (newOrder: DynamicColumn[]) => Promise<void>
  resetToPreset: (preset: "tech" | "sales" | "finance") => Promise<void>
  refresh: () => Promise<void>
}

const ColumnsContext = createContext<ColumnsContextValue | null>(null)

export function useColumns() {
  const ctx = useContext(ColumnsContext)
  if (!ctx) throw new Error("useColumns must be used within ColumnsProvider")
  return ctx
}

export function ColumnsProvider({ children }: { children: React.ReactNode }) {
  const [columns, setColumns] = useState<DynamicColumn[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const res = await fetch("/api/columns")
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setColumns(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const addColumn = useCallback(async (col: Partial<DynamicColumn> & { title: string }) => {
    const res = await fetch("/api/columns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(col),
    })
    if (res.ok) {
      const newCol = await res.json()
      setColumns(prev => [...prev, newCol].sort((a, b) => a.position - b.position))
    }
  }, [])

  const updateColumn = useCallback(async (id: string, patch: Partial<DynamicColumn>) => {
    // Optimistic update
    setColumns(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c).sort((a, b) => a.position - b.position))
    await fetch(`/api/columns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
  }, [])

  const deleteColumn = useCallback(async (id: string, force = false): Promise<{ error?: string; count?: number }> => {
    const res = await fetch(`/api/columns/${id}${force ? "?force=true" : ""}`, { method: "DELETE" })
    const data = await res.json()
    if (res.ok) {
      setColumns(prev => prev.filter(c => c.id !== id))
      return {}
    }
    return data
  }, [])

  const reorderColumns = useCallback(async (newOrder: DynamicColumn[]) => {
    const reindexed = newOrder.map((c, i) => ({ ...c, position: i }))
    setColumns(reindexed)
    await fetch("/api/columns/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns: reindexed }),
    })
  }, [])

  const resetToPreset = useCallback(async (preset: "tech" | "sales" | "finance") => {
    const { DEFAULT_COLUMNS, SALES_COLUMNS, FINANCE_COLUMNS } = await import("@/lib/column-presets")
    const map = { tech: DEFAULT_COLUMNS, sales: SALES_COLUMNS, finance: FINANCE_COLUMNS }
    const res = await fetch("/api/columns/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns: map[preset] }),
    })
    if (res.ok) {
      const data = await res.json()
      setColumns(data)
    }
  }, [])

  const defaultColumn = columns.find(c => c.isDefault)
  const rejectedColumns = columns.filter(c => c.isRejected)
  const interviewEligibleColumns = columns.filter(c => c.isInterviewEligible)
  const offerStageColumns = columns.filter(c => c.isOfferStage)

  return (
    <ColumnsContext.Provider value={{
      columns, loading, defaultColumn, rejectedColumns, interviewEligibleColumns, offerStageColumns,
      addColumn, updateColumn, deleteColumn, reorderColumns, resetToPreset, refresh,
    }}>
      {children}
    </ColumnsContext.Provider>
  )
}
