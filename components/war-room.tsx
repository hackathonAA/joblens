"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trophy, X, Sparkles, Loader2, Pencil, Check, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  type Offer,
  REC_CONFIG,
  recommendationFor,
  totalComp,
  fmtMoney,
  fmtFull,
} from "@/lib/war-room-data"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/lib/currency-context"

type RowKind = "higher" | "lower" | "none"
type Row = { key: string; label: string; value: (o: Offer) => number | null; render: (o: Offer, editing?: boolean, onChange?: (v: string) => void) => React.ReactNode; better: RowKind }

const LOGO_COLORS = [
  "bg-blue-500/15 text-blue-400 ring-1 ring-inset ring-blue-500/25",
  "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/25",
  "bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/25",
]

type OfferWithRaw = Offer & { _raw: any }

function dbOfferToOffer(o: any, index: number): OfferWithRaw {
  const equity = o.equityValue ?? 0
  return {
    id: o.id,
    company: o.company ?? "Unknown",
    role: o.role ?? "Unknown",
    stage: "Public",
    initials: (o.company ?? "?").slice(0, 2).toUpperCase(),
    logo: LOGO_COLORS[index % LOGO_COLORS.length],
    baseSalary: o.baseSalary ?? 0,
    equityValue: equity,
    vesting: o.vestingSchedule ?? "4 yr",
    cliff: o.cliffMonths ? `${o.cliffMonths} months` : "1 year",
    signingBonus: o.signingBonus ?? 0,
    nonCompeteRisk: 3,
    benefitsScore: 7,
    upside: { low: equity * 0.5, mid: equity * 2, high: equity * 5 },
    _raw: o,
  }
}

type FormState = { applicationId: string; baseSalary: string; equityValue: string; vestingSchedule: string; cliffMonths: string; signingBonus: string }
const EMPTY_FORM: FormState = { applicationId: "", baseSalary: "", equityValue: "", vestingSchedule: "4 yr (25/mo)", cliffMonths: "12", signingBonus: "" }

export function WarRoom() {
  const [offers, setOffers] = useState<OfferWithRaw[]>([])
  const [applications, setApplications] = useState<{ id: string; company: string; role: string; salaryMin?: number; salaryMax?: number; status?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const { currency } = useCurrency()
  const sym = currency.symbol
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Record<string, string>>({})
  const [aiInsights, setAiInsights] = useState<{ recommendation: string; negotiationTips: string[] } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [duplicateError, setDuplicateError] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/offers").then(r => r.json()),
      fetch("/api/applications").then(r => r.json()),
      fetch("/api/columns").then(r => r.json()),
    ]).then(([offersData, appsData, colsData]) => {
      if (Array.isArray(offersData)) setOffers(offersData.map((o, i) => dbOfferToOffer(o, i)))
      if (Array.isArray(appsData) && Array.isArray(colsData)) {
        // Only show apps that are past the default (Applied) column and not rejected
        const excludeKeys = new Set<string>([
          ...colsData.filter((c: any) => c.isDefault || c.isRejected).map((c: any) => c.columnKey)
        ])
        const filtered = appsData.filter((a: any) => !excludeKeys.has(a.status ?? ""))
        setApplications(filtered.map((a: any) => ({
          id: a.id, company: a.company, role: a.role,
          salaryMin: a.salaryMin, salaryMax: a.salaryMax, status: a.status
        })))
      }
    }).finally(() => setLoading(false))
  }, [])

  async function fetchAiInsights(currentOffers: OfferWithRaw[]) {
    if (currentOffers.length === 0) return
    setAiLoading(true)
    setAiInsights(null)
    try {
      const res = await fetch("/api/war-room-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offers: currentOffers,
          currency: currency.symbol,
          currencyCode: currency.code,
        }),
      })
      const data = await res.json()
      if (data.recommendation) setAiInsights(data)
    } finally {
      setAiLoading(false)
    }
  }

  // Initial AI load
  useEffect(() => {
    if (!loading && offers.length > 0) fetchAiInsights(offers)
  }, [loading])

  // Merge draft values into the editing offer so calculations update live
  const liveOffers = useMemo(() => offers.map(o => {
    if (o.id !== editingId) return o
    const base = parseInt(editDraft.baseSalary) || o.baseSalary
    const equity = parseInt(editDraft.equityValue) || o.equityValue
    const signing = parseInt(editDraft.signingBonus) || o.signingBonus
    const cliff = parseInt(editDraft.cliffMonths) || 12
    return {
      ...o,
      baseSalary: base,
      equityValue: equity,
      signingBonus: signing,
      vesting: editDraft.vestingSchedule || o.vesting,
      cliff: `${cliff} months`,
      upside: { low: equity * 0.5, mid: equity * 2, high: equity * 5 },
    }
  }), [offers, editingId, editDraft])

  const winnersByRow = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    if (liveOffers.length < 2) return map  // no comparison with single offer
    const ROWS = getRows(liveOffers, editingId, editDraft, () => {}, sym)
    for (const row of ROWS) {
      if (row.better === "none") { map[row.key] = new Set(); continue }
      const vals = liveOffers.map(o => ({ id: o.id, v: row.value(o) })).filter(x => x.v !== null) as { id: string; v: number }[]
      if (!vals.length) { map[row.key] = new Set(); continue }
      const best = row.better === "higher" ? Math.max(...vals.map(x => x.v)) : Math.min(...vals.map(x => x.v))
      const allEqual = vals.every(x => x.v === vals[0].v)
      map[row.key] = new Set(allEqual ? [] : vals.filter(x => x.v === best).map(x => x.id))
    }
    return map
  }, [liveOffers, editingId, editDraft])

  const winner = useMemo(() => {
    if (liveOffers.length < 2) return null
    return [...liveOffers].sort((a, b) => {
      const aPenalty = a.nonCompeteRisk >= 7 ? 60000 : 0
      const bPenalty = b.nonCompeteRisk >= 7 ? 60000 : 0
      return totalComp(b) - bPenalty - (totalComp(a) - aPenalty)
    })[0]
  }, [liveOffers])

  function startEdit(o: OfferWithRaw) {
    setEditingId(o.id)
    setEditDraft({
      baseSalary: String(o.baseSalary),
      equityValue: String(o.equityValue),
      signingBonus: String(o.signingBonus),
      cliffMonths: String(o._raw.cliffMonths ?? 12),
      vestingSchedule: o._raw.vestingSchedule ?? o.vesting,
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const res = await fetch(`/api/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseSalary: parseInt(editDraft.baseSalary) || 0,
        equityValue: parseInt(editDraft.equityValue) || 0,
        signingBonus: parseInt(editDraft.signingBonus) || 0,
        cliffMonths: parseInt(editDraft.cliffMonths) || 12,
        vestingSchedule: editDraft.vestingSchedule,
      }),
    })
    const updated = await res.json()
    if (updated.id) {
      const newOffers = offers.map((o, i) => o.id === id ? dbOfferToOffer(updated, i) : o)
      setOffers(newOffers)
      // Also sync salary back to tracker application
      const offer = offers.find(o => o.id === id)
      if (offer?._raw.applicationId) {
        await fetch(`/api/applications/${offer._raw.applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salaryMin: parseInt(editDraft.baseSalary) || 0,
          }),
        })
      }
      // Refresh AI insights after edit
      fetchAiInsights(newOffers)
    }
    setEditingId(null)
    setSaving(false)
  }

  async function deleteOffer(id: string) {
    await fetch(`/api/offers/${id}`, { method: "DELETE" })
    setOffers(prev => prev.filter(o => o.id !== id))
  }

  async function handleAddOffer(e: React.FormEvent) {
    e.preventDefault()
    setDuplicateError("")

    // Prevent adding the same application twice
    if (offers.some(o => o._raw.applicationId === form.applicationId)) {
      setDuplicateError("This application is already in the War Room.")
      return
    }

    setSaving(true)
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: form.applicationId,
        baseSalary: parseInt(form.baseSalary) || 0,
        equityValue: parseInt(form.equityValue) || 0,
        vestingSchedule: form.vestingSchedule,
        cliffMonths: parseInt(form.cliffMonths) || 12,
        signingBonus: parseInt(form.signingBonus) || 0,
      }),
    })
    const offer = await res.json()
    if (offer.id) {
      const newOffers = [...offers, dbOfferToOffer(offer, offers.length)]
      setOffers(newOffers)
      setShowForm(false)
      setForm(EMPTY_FORM)
      fetchAiInsights(newOffers)
    }
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-muted-foreground py-8">Loading offers…</p>

  // Filter out applications that are rejected or already in war room
  const rejectedAppIds = new Set(applications.filter(a => {
    // We don't have the column info here, but status check via offers is enough
    return false // We handle this at the API level
  }).map(a => a.id))
  const existingOfferAppIds = new Set(offers.map(o => o._raw.applicationId))
  const availableApps = applications.filter(a => !existingOfferAppIds.has(a.id))

  const ROWS = getRows(liveOffers, editingId, editDraft, (key, val) => setEditDraft(d => ({ ...d, [key]: val })), sym)
  const gridCols = { gridTemplateColumns: `minmax(160px, 1fr) repeat(${Math.max(liveOffers.length, 1)}, minmax(180px, 1.4fr))` }

  return (
    <div className="flex flex-col gap-6">

      {/* Summary bar */}
      {liveOffers.length > 0 && (
        <div className={cn("grid gap-3", liveOffers.length === 1 ? "grid-cols-1 max-w-sm" : "grid-cols-3")}>
          {liveOffers.map(o => {
            const tc = totalComp(o)
            const isWinner = winner?.id === o.id
            return (
              <div key={o.id} className={cn("rounded-xl border border-border bg-card p-4 flex flex-col gap-2", isWinner && "border-emerald-500/40 bg-emerald-500/5")}>
                <div className="flex items-center justify-between">
                  <span className={cn("flex size-8 items-center justify-center rounded-full text-xs font-bold", o.logo)}>{o.initials}</span>
                  {isWinner && <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1"><Trophy className="size-3" />Top pick</span>}
                </div>
                <div>
                  <p className="text-sm font-bold text-card-foreground">{o.company}</p>
                  <p className="text-xs text-muted-foreground">{o.role}</p>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-lg font-bold text-card-foreground">{fmtMoney(tc, sym)}</span>
                  <span className="text-xs text-muted-foreground">/yr total comp</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Base {fmtMoney(o.baseSalary, sym)} + Equity {fmtMoney(o.equityValue / 4, sym)}/yr + Signing {fmtMoney(o.signingBonus / 4, sym)}/yr
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Comparison table */}
      {liveOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <TrendingUp className="size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No offers yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add an offer below to start comparing.</p>
        </div>
      ) : liveOffers.length === 1 ? (
        // Single offer — show details without comparison
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <div className="min-w-fit">
            <div className="grid items-stretch border-b border-border" style={{ gridTemplateColumns: "minmax(160px,1fr) minmax(200px,1.4fr)" }}>
              <div className="flex items-end p-4">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Offer details</span>
              </div>
              {liveOffers.map(o => {
                const isEditing = editingId === o.id
                return (
                  <div key={o.id} className="relative border-l border-border p-4">
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      {isEditing ? (
                        <button onClick={() => saveEdit(o.id)} disabled={saving} className="rounded-md p-1 text-emerald-400 hover:bg-secondary">
                          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        </button>
                      ) : (
                        <button onClick={() => startEdit(o)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                      <button onClick={() => deleteOffer(o.id)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-red-400">
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2.5 pr-14">
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", o.logo)}>{o.initials}</span>
                      <div>
                        <p className="text-sm font-bold text-card-foreground">{o.company}</p>
                        <p className="text-xs text-muted-foreground">{o.role}</p>
                      </div>
                    </div>
                    {isEditing && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Editing — click ✓ to save</span>}
                  </div>
                )
              })}
            </div>
            {ROWS.map((row, i) => (
              <div key={row.key} className={cn("grid items-center", i !== ROWS.length - 1 && "border-b border-border")}
                style={{ gridTemplateColumns: "minmax(160px,1fr) minmax(200px,1.4fr)" }}>
                <div className="p-4 text-sm font-medium text-muted-foreground">{row.label}</div>
                {liveOffers.map(o => (
                  <div key={o.id} className="border-l border-border p-4 text-sm text-card-foreground">
                    {row.render(o, editingId === o.id)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <div className="min-w-fit">
            <div className="grid items-stretch border-b border-border" style={gridCols}>
              <div className="flex items-end p-4">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Offer details</span>
              </div>
              {liveOffers.map(o => {
                const isEditing = editingId === o.id
                return (
                  <div key={o.id} className={cn("relative border-l border-border p-4", winner?.id === o.id && "bg-emerald-500/5")}>
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      {isEditing ? (
                        <button onClick={() => saveEdit(o.id)} disabled={saving} className="rounded-md p-1 text-emerald-400 hover:bg-secondary">
                          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        </button>
                      ) : (
                        <button onClick={() => startEdit(o)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                      <button onClick={() => deleteOffer(o.id)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-red-400">
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2.5 pr-14">
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", o.logo)}>{o.initials}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-card-foreground">{o.company}</p>
                        <p className="truncate text-xs text-muted-foreground">{o.role}</p>
                      </div>
                    </div>
                    {isEditing && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Editing — click ✓ to save</span>}
                  </div>
                )
              })}
            </div>
            {ROWS.map((row, i) => (
              <div key={row.key} className={cn("grid items-center", i !== ROWS.length - 1 && "border-b border-border")} style={gridCols}>
                <div className="p-4 text-sm font-medium text-muted-foreground">{row.label}</div>
                {liveOffers.map(o => {
                  const isBest = winnersByRow[row.key]?.has(o.id)
                  const isEditing = editingId === o.id
                  return (
                    <div key={o.id} className={cn("border-l border-border p-4 text-sm text-card-foreground", isBest && !isEditing && "bg-emerald-500/10")}>
                      <div className="flex items-center gap-1.5">
                        {isBest && !isEditing && <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />}
                        <span className={cn(isBest && !isEditing && "font-semibold text-emerald-400")}>
                          {row.render(o, isEditing)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add offer button / form */}
      {liveOffers.length < 3 && !showForm && (
        <Button type="button" variant="outline" onClick={() => { setShowForm(true); setDuplicateError("") }} className="gap-2 border-dashed bg-transparent w-fit">
          <Plus className="size-4" /> Add Offer
        </Button>
      )}

      {showForm && (
        <form onSubmit={handleAddOffer} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 max-w-lg">
          <h3 className="text-sm font-semibold text-foreground">Add Offer</h3>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Application *</label>
            <select required value={form.applicationId} onChange={e => {
                const app = applications.find(a => a.id === e.target.value)
                setDuplicateError("")
                setForm(f => ({
                  ...f,
                  applicationId: e.target.value,
                  baseSalary: app?.salaryMin ? String(app.salaryMin) : f.baseSalary,
                }))
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select application…</option>
              {availableApps.map(a => <option key={a.id} value={a.id}>{a.company} — {a.role}</option>)}
            </select>
            {duplicateError && <p className="mt-1 text-xs text-red-400">{duplicateError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "baseSalary", label: `Base Salary (${sym})` },
              { key: "equityValue", label: `Equity Value (${sym})` },
              { key: "signingBonus", label: `Signing Bonus (${sym})` },
              { key: "cliffMonths", label: "Cliff (months)" },
            ] as const).map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
                <input type="number" value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Vesting Schedule</label>
            <input value={form.vestingSchedule} onChange={e => setForm(f => ({ ...f, vestingSchedule: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !form.applicationId}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 className="size-3.5 animate-spin" />} Save Offer
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setDuplicateError("") }}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Negotiation tips — only with 2+ offers */}
      {liveOffers.length >= 2 && winner && !aiInsights && !aiLoading && (
        <NegotiationTips offers={liveOffers} winner={winner} sym={sym} />
      )}

      {/* AI Insights */}
      {liveOffers.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Sparkles className="size-4" />
              </span>
              <h2 className="text-sm font-bold text-foreground">AI Recommendation</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Powered by Amazon Nova</span>
            </div>
            <button onClick={() => fetchAiInsights(liveOffers)} disabled={aiLoading}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 flex items-center gap-1">
              <RefreshCw className={`size-3 ${aiLoading ? "animate-spin" : ""}`} />
              {aiLoading ? "Analyzing…" : "Refresh"}
            </button>
          </div>

          {aiLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Amazon Nova is analyzing your offer{liveOffers.length > 1 ? "s" : ""}…
            </div>
          ) : aiInsights ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{aiInsights.recommendation}</p>
              {aiInsights.negotiationTips?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-amber-400" /> Negotiation Playbook
                  </p>
                  <ul className="flex flex-col gap-2">
                    {aiInsights.negotiationTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add at least one offer to get AI-powered recommendations.</p>
          )}
        </div>
      )}
    </div>
  )
}
function NegotiationTips({ offers, winner, sym = "₹" }: { offers: OfferWithRaw[]; winner: Offer; sym?: string }) {
  const loser = offers.find(o => o.id !== winner.id)
  if (!loser) return null
  const gap = totalComp(winner) - totalComp(loser)
  const signingGap = winner.signingBonus - loser.signingBonus
  const equityGap = winner.equityValue - loser.equityValue

  const tips: { icon: React.ReactNode; text: string }[] = []

  if (loser.baseSalary > 0 && loser.baseSalary < winner.baseSalary) {
    tips.push({
      icon: <TrendingUp className="size-3.5 text-amber-400" />,
      text: `Tell ${loser.company} that ${winner.company} is offering ${fmtFull(winner.baseSalary, sym)} base — ask them to close the ${fmtMoney(winner.baseSalary - loser.baseSalary, sym)} gap.`,
    })
  }
  if (signingGap > 0) {
    tips.push({
      icon: <TrendingUp className="size-3.5 text-blue-400" />,
      text: `${loser.company}'s signing bonus is ${fmtMoney(signingGap, sym)} lower. Ask them to bridge this as a one-time payment — it costs them less than a salary increase.`,
    })
  }
  if (equityGap > 0) {
    tips.push({
      icon: <TrendingUp className="size-3.5 text-emerald-400" />,
      text: `Equity delta is ${fmtMoney(equityGap, sym)}. If ${loser.company} can't match on cash, ask for additional equity options to compensate.`,
    })
  }
  tips.push({
    icon: <AlertTriangle className="size-3.5 text-amber-400" />,
    text: `Get both offers in writing before negotiating. Saying "I have a competing offer at ${fmtMoney(totalComp(winner), sym)}/yr" is your strongest lever.`,
  })

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
      <h3 className="mb-3 text-sm font-bold text-foreground flex items-center gap-2">
        <AlertTriangle className="size-4 text-amber-400" /> Negotiation Playbook
      </h3>
      <div className="flex flex-col gap-2.5">
        {tips.map((t, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0">{t.icon}</span>
            <p className="text-sm text-muted-foreground">{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function getRows(
  offers: OfferWithRaw[],
  editingId: string | null,
  editDraft: Record<string, string>,
  onDraftChange: (key: string, val: string) => void,
  sym = "₹"
): Row[] {
  return [
    {
      key: "base", label: "Base Salary", better: "higher",
      value: o => o.baseSalary,
      render: (o, editing) => editing
        ? <InlineEdit value={editDraft.baseSalary ?? ""} onChange={v => onDraftChange("baseSalary", v)} prefix={sym} />
        : fmtFull(o.baseSalary, sym),
    },
    {
      key: "equity", label: `Total Equity (${sym} value)`, better: "higher",
      value: o => o.equityValue,
      render: (o, editing) => editing
        ? <InlineEdit value={editDraft.equityValue ?? ""} onChange={v => onDraftChange("equityValue", v)} prefix={sym} />
        : fmtFull(o.equityValue, sym),
    },
    {
      key: "vesting", label: "Vesting Schedule", better: "none",
      value: () => null,
      render: (o, editing) => editing
        ? <input value={editDraft.vestingSchedule ?? ""} onChange={e => onDraftChange("vestingSchedule", e.target.value)}
            className="w-32 rounded border border-primary/40 bg-primary/5 px-2 py-0.5 text-sm text-card-foreground outline-none" />
        : o.vesting,
    },
    {
      key: "cliff", label: "Cliff", better: "none",
      value: () => null,
      render: (o, editing) => editing
        ? <InlineEdit value={editDraft.cliffMonths ?? ""} onChange={v => onDraftChange("cliffMonths", v)} prefix="mo:" />
        : o.cliff,
    },
    {
      key: "signing", label: "Signing Bonus", better: "higher",
      value: o => o.signingBonus,
      render: (o, editing) => editing
        ? <InlineEdit value={editDraft.signingBonus ?? ""} onChange={v => onDraftChange("signingBonus", v)} prefix={sym} />
        : fmtFull(o.signingBonus, sym),
    },
    {
      key: "totalcomp", label: "4-yr Total Comp", better: "higher",
      value: o => totalComp(o),
      render: o => <span className="font-semibold">{fmtMoney(totalComp(o), sym)}/yr</span>,
    },
    {
      key: "upside", label: "Equity Upside Estimate", better: "higher",
      value: o => o.upside.mid,
      render: o => (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="text-muted-foreground">Low <span className="text-card-foreground">{fmtMoney(o.upside.low, sym)}</span></span>
          <span className="text-muted-foreground">Mid <span className="font-semibold text-card-foreground">{fmtMoney(o.upside.mid, sym)}</span></span>
          <span className="text-muted-foreground">High <span className="text-card-foreground">{fmtMoney(o.upside.high, sym)}</span></span>
        </div>
      ),
    },
    {
      key: "rec", label: "Overall Recommendation", better: "none",
      value: () => null,
      render: o => {
        const rec = recommendationFor(o)
        return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", REC_CONFIG[rec])}>{rec}</span>
      },
    },
  ]
}

function InlineEdit({ value, onChange, prefix }: { value: string; onChange: (v: string) => void; prefix?: string }) {
  return (
    <div className="flex items-center gap-1">
      {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        className="w-28 rounded border border-primary/40 bg-primary/5 px-2 py-0.5 text-sm text-card-foreground outline-none focus:ring-1 focus:ring-primary" />
    </div>
  )
}
