"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { JobCard } from "@/lib/kanban-data"

export function EditCardModal({
  card,
  onClose,
  onSave,
}: {
  card: JobCard
  onClose: () => void
  onSave: (data: Partial<JobCard>) => void
}) {
  const [company, setCompany] = useState(card.company)
  const [role, setRole] = useState(card.role)
  const [salaryMin, setSalaryMin] = useState(String(card.salaryMin || ""))
  const [salaryMax, setSalaryMax] = useState(String(card.salaryMax || ""))
  const [notes, setNotes] = useState(card.notes ?? "")
  const [location, setLocation] = useState(card.location ?? "")
  const [jobUrl, setJobUrl] = useState(card.jobUrl ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !role.trim()) return
    onSave({
      company: company.trim(),
      role: role.trim(),
      salaryMin: parseInt(salaryMin) || 0,
      salaryMax: parseInt(salaryMax) || 0,
      notes: notes.trim(),
      location: location.trim(),
      jobUrl: jobUrl.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-card-foreground">Edit Application</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Company *</label>
              <input autoFocus value={company} onChange={e => setCompany(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Role *</label>
              <input value={role} onChange={e => setRole(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Salary Min (k)</label>
              <input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="150"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Salary Max (k)</label>
              <input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="200"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA (Remote)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Job URL</label>
              <input type="url" value={jobUrl} onChange={e => setJobUrl(e.target.value)} placeholder="https://..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Any notes about this application…"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button type="submit" disabled={!company.trim() || !role.trim()}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40">
              Save Changes
            </button>
            <button type="button" onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
