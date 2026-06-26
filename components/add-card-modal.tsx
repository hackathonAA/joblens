"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { ColumnId } from "@/lib/kanban-data"
import { useCurrency } from "@/lib/currency-context"

export function AddCardModal({
  columnKey,
  columnTitle,
  onClose,
  onSave,
}: {
  columnKey: string
  columnTitle: string
  onClose: () => void
  onSave: (data: { company: string; role: string; salaryMin: number; salaryMax: number; notes: string; location: string; jobUrl: string }) => void
}) {
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [salaryMin, setSalaryMin] = useState("")
  const [salaryMax, setSalaryMax] = useState("")
  const { currency } = useCurrency()
  const [notes, setNotes] = useState("")
  const [location, setLocation] = useState("")
  const [jobUrl, setJobUrl] = useState("")

  const [salaryError, setSalaryError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !role.trim()) return
    const min = parseInt(salaryMin) || 0
    const max = parseInt(salaryMax) || 0
    if (min > 0 && max > 0 && min >= max) {
      setSalaryError("Min salary must be less than max salary")
      return
    }
    setSalaryError("")
    onSave({
      company: company.trim(),
      role: role.trim(),
      salaryMin: min,
      salaryMax: max,
      notes: notes.trim(),
      location: location.trim(),
      jobUrl: jobUrl.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-card-foreground">Add Application</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Company *</label>
              <input
                autoFocus
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Role *</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Min Salary ({currency.symbol})</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => { setSalaryMin(e.target.value); setSalaryError("") }}
                placeholder="e.g. 15"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Max Salary ({currency.symbol})</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => { setSalaryMax(e.target.value); setSalaryError("") }}
                placeholder="e.g. 20"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {salaryError && (
              <p className="col-span-2 text-xs text-red-400">{salaryError}</p>
            )}
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA (Remote)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Job URL</label>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this application…"
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!company.trim() || !role.trim()}
            className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Add to {columnTitle}
          </button>
        </form>
      </div>
    </div>
  )
}
