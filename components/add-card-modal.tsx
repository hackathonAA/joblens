"use client"

import { useState } from "react"
import { X, Building2, Briefcase, MapPin, Link2, FileText, IndianRupee } from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">{label}</label>
      {children}
    </div>
  )
}

const INPUT = "w-full rounded-xl border border-border/70 bg-secondary/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"

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
  const [company, setCompany]     = useState("")
  const [role, setRole]           = useState("")
  const [salaryMin, setSalaryMin] = useState("")
  const [salaryMax, setSalaryMax] = useState("")
  const [notes, setNotes]         = useState("")
  const [location, setLocation]   = useState("")
  const [jobUrl, setJobUrl]       = useState("")
  const [salaryError, setSalaryError] = useState("")
  const { currency } = useCurrency()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !role.trim()) return
    const min = parseInt(salaryMin) || 0
    const max = parseInt(salaryMax) || 0
    if (min > 0 && max > 0 && min >= max) {
      setSalaryError("Min must be less than max")
      return
    }
    setSalaryError("")
    onSave({ company: company.trim(), role: role.trim(), salaryMin: min, salaryMax: max, notes: notes.trim(), location: location.trim(), jobUrl: jobUrl.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border/80 bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div>
            <h2 className="text-base font-bold text-card-foreground">Add Application</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Adding to <span className="text-foreground font-medium">{columnTitle}</span></p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Required fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Company *">
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
                  <input
                    autoFocus
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Google"
                    className={INPUT + " pl-9"}
                  />
                </div>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Role *">
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
                  <input
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className={INPUT + " pl-9"}
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Salary */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 mb-1.5">Salary ({currency.symbol})</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={salaryMin}
                onChange={e => { setSalaryMin(e.target.value); setSalaryError("") }}
                placeholder="Min (LPA)"
                className={INPUT}
              />
              <input
                type="number"
                value={salaryMax}
                onChange={e => { setSalaryMax(e.target.value); setSalaryError("") }}
                placeholder="Max (LPA)"
                className={INPUT}
              />
            </div>
            {salaryError && (
              <p className="mt-1 text-xs text-red-400">{salaryError}</p>
            )}
          </div>

          {/* Optional fields */}
          <Field label="Location">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Bangalore, India (Remote)"
                className={INPUT + " pl-9"}
              />
            </div>
          </Field>

          <Field label="Job URL">
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
              <input
                type="url"
                value={jobUrl}
                onChange={e => setJobUrl(e.target.value)}
                placeholder="https://..."
                className={INPUT + " pl-9"}
              />
            </div>
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about this application…"
              rows={2}
              className={INPUT + " resize-none"}
            />
          </Field>

          <button
            type="submit"
            disabled={!company.trim() || !role.trim()}
            className="mt-1 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-[0_0_16px_oklch(0.64_0.22_262/25%)] transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Add to {columnTitle}
          </button>
        </form>
      </div>
    </div>
  )
}
