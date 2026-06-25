"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trophy, X, Sparkles, Loader2, Pencil, Check, TrendingUp, DollarSign, AlertTriangle } from "lucide-react"
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
  const [applications, setApplications] = useState<{ id: string; company: string; role: string; salaryMin?: number; salaryMax?: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Record<string, string>>({})
  const [aiInsights, setAiInsights] = useState<{ recommendation: string; negotiationTips: string[] } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/offers").then(r => r.json()),
      fetch("/api/applications?excludeRejected=true").then(r => r.json()),
    ]).then(([offersData, appsData]) => {
      if (Array.isArray(offersData)) setOffers(offersData.map((o, i) => dbOfferToOffer(o, i)))
      if (Array.isArray(appsData)) setApplications(appsData.map((a: any) => ({ id: a.id, company: a.company, role: a.role, salaryMin: a.salaryMin, salaryMax: a.salaryMax })))
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
        body: JSON.stringify({ offers: currentOffers }),
      })
      const data = await res.json()
      if (data.recommendation) setAiInsights(data)
    } finally {
      setAiLoading(false)
    }
  }

  // Fetch AI insights whenever offers list changes
  useEffect(() => {
    if (!loading && offers.length > 0) fetchAiInsights(offers)
  }, [offers.length, loading])

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
    const ROWS = getRows(liveOffers, editingId, editDraft, () => {})
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
    if (!liveOffers.length) return null
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
      setOffers(prev => prev.map((o, i) => o.id === id ? dbOfferToOffer(updated, i) : o))
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
      setOffers(prev => [...prev, dbOfferToOffer(offer, prev.length)])
      setShowForm(false)
      setForm(EMPTY_FORM)
    }
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-muted-foreground py-8">Loading offers…</p>

  const ROWS = getRows(liveOffers, editingId, editDraft, (key, val) => setEditDraft(d => ({ ...d, [key]: val })))
  const gridCols = { gridTemplateColumns: `minmax(160px, 1fr) repeat(${Math.max(liveOffers.length, 1)}, minmax(180px, 1.4fr))` }

  return (
    <div className="flex flex-col gap-6">

      {/* Summary bar */}
      {liveOffers.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
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
                  <DollarSign className="size-3.5 text-muted-foreground" />
                  <span className="text-lg font-bold text-card-foreground">{fmtMoney(tc)}</span>
                  <span className="text-xs text-muted-foreground">/yr total comp</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Base {fmtMoney(o.baseSalary)} + Equity {fmtMoney(o.equityValue / 4)}/yr + Signing {fmtMoney(o.signingBonus / 4)}/yr
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
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <div className="min-w-fit">
            {/* Header */}
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
                        <button onClick={() => saveEdit(o.id)} disabled={saving}
                          className="rounded-md p-1 text-emerald-400 hover:bg-secondary">
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
                    {isEditing && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Editing — click ✓ to save
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Rows */}
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
        <Button type="button" variant="outline" onClick={() => setShowForm(true)} className="gap-2 border-dashed bg-transparent w-fit">
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
                setForm(f => ({
                  ...f,
                  applicationId: e.target.value,
                  baseSalary: app?.salaryMin ? String(app.salaryMin * 1000) : f.baseSalary,
                  equityValue: f.equityValue,
                }))
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select application…</option>
              {applications.map(a => <option key={a.id} value={a.id}>{a.company} — {a.role}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "baseSalary", label: "Base Salary ($)" },
              { key: "equityValue", label: "Equity Value ($)" },
              { key: "signingBonus", label: "Signing Bonus ($)" },
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
            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Negotiation tips */}
      {liveOffers.length >= 2 && winner && !aiInsights && !aiLoading && (
        <NegotiationTips offers={liveOffers} winner={winner} />
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
              <Loader2 className={`size-3 ${aiLoading ? "animate-spin" : ""}`} />
              {aiLoading ? "Analyzing…" : "Refresh"}
            </button>
          </div>

          {aiLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Claude is analyzing your offers…
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

function NegotiationTips({ offers, winner }: { offers: OfferWithRaw[]; winner: Offer }) {
  const loser = offers.find(o => o.id !== winner.id)
  if (!loser) return null
  const gap = totalComp(winner) - totalComp(loser)
  const signingGap = winner.signingBonus - loser.signingBonus
  const equityGap = winner.equityValue - loser.equityValue

  const tips: { icon: React.ReactNode; text: string }[] = []

  if (loser.baseSalary > 0 && loser.baseSalary < winner.baseSalary) {
    tips.push({
      icon: <DollarSign className="size-3.5 text-amber-400" />,
      text: `Tell ${loser.company} that ${winner.company} is offering ${fmtFull(winner.baseSalary)} base — ask them to close the ${fmtMoney(winner.baseSalary - loser.baseSalary)} gap.`,
    })
  }
  if (signingGap > 0) {
    tips.push({
      icon: <TrendingUp className="size-3.5 text-blue-400" />,
      text: `${loser.company}'s signing bonus is ${fmtMoney(signingGap)} lower. Ask them to bridge this as a one-time payment — it costs them less than a salary increase.`,
    })
  }
  if (equityGap > 0) {
    tips.push({
      icon: <TrendingUp className="size-3.5 text-emerald-400" />,
      text: `Equity delta is ${fmtMoney(equityGap)}. If ${loser.company} can't match on cash, ask for additional equity options to compensate.`,
    })
  }
  tips.push({
    icon: <AlertTriangle className="size-3.5 text-amber-400" />,
    text: `Get both offers in writing before negotiating. Saying "I have a competing offer at ${fmtMoney(totalComp(winner))}/yr" is your strongest lever.`,
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
  onDraftChange: (key: string, val: string) => void
): Row[] {
  return [
    {
      key: "base", label: "Base Salary", better: "higher",
      value: o => o.baseSalary,
      render: (o, editing) => editing
        ? <InlineEdit value={editDraft.baseSalary ?? ""} onChange={v => onDraftChange("baseSalary", v)} prefix="$" />
        : fmtFull(o.baseSalary),
    },
    {
      key: "equity", label: "Total Equity ($ value)", better: "higher",
      value: o => o.equityValue,
      render: (o, editing) => editing
        ? <InlineEdit value={editDraft.equityValue ?? ""} onChange={v => onDraftChange("equityValue", v)} prefix="$" />
        : fmtFull(o.equityValue),
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
        ? <InlineEdit value={editDraft.signingBonus ?? ""} onChange={v => onDraftChange("signingBonus", v)} prefix="$" />
        : fmtFull(o.signingBonus),
    },
    {
      key: "totalcomp", label: "4-yr Total Comp", better: "higher",
      value: o => totalComp(o),
      render: o => <span className="font-semibold">{fmtMoney(totalComp(o))}/yr</span>,
    },
    {
      key: "upside", label: "Equity Upside Estimate", better: "higher",
      value: o => o.upside.mid,
      render: o => (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="text-muted-foreground">Low <span className="text-card-foreground">{fmtMoney(o.upside.low)}</span></span>
          <span className="text-muted-foreground">Mid <span className="font-semibold text-card-foreground">{fmtMoney(o.upside.mid)}</span></span>
          <span className="text-muted-foreground">High <span className="text-card-foreground">{fmtMoney(o.upside.high)}</span></span>
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
