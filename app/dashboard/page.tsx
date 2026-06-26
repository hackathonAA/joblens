"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { RefreshCw, AlertCircle, Mail, Loader2, CheckCircle, TrendingDown } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { ApplicationsBarChart, ResponseRateLineChart } from "@/components/dashboard-charts"
import { ApplicationFunnel } from "@/components/application-funnel"
import { InsightCard } from "@/components/insight-card"
import { StatCards } from "@/components/stat-cards"
import { cn } from "@/lib/utils"

type StaleApp = { id: string; company: string; role: string; status: string; daysSince: number }
type RejectionPattern = { worstStage: string | null; totalRejected: number; failedRounds: Record<string, number>; rejectionRate: number }

function FollowUpSection({ staleApps }: { staleApps: StaleApp[] }) {
  const [drafts, setDrafts] = useState<Record<string, { subject: string; body: string } | null>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [sent, setSent] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!staleApps?.length) return null

  async function draftEmail(appId: string) {
    setLoading(l => ({ ...l, [appId]: true }))
    try {
      const res = await fetch(`/api/applications/${appId}/followup-draft`, { method: "POST" })
      const data = await res.json()
      setDrafts(d => ({ ...d, [appId]: data }))
      setExpanded(appId)
    } finally {
      setLoading(l => ({ ...l, [appId]: false }))
    }
  }

  function copyDraft(appId: string) {
    const draft = drafts[appId]
    if (!draft) return
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`)
    setSent(s => ({ ...s, [appId]: true }))
    setTimeout(() => setSent(s => ({ ...s, [appId]: false })), 2000)
  }

  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="size-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-card-foreground">Follow-up Needed</h3>
        <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
          {staleApps.length} app{staleApps.length !== 1 ? "s" : ""}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">Not updated in 7+ days</span>
      </div>
      <div className="flex flex-col gap-2">
        {staleApps.map(app => (
          <div key={app.id} className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">{app.company}</p>
                <p className="text-xs text-muted-foreground truncate">{app.role} · {app.daysSince} days ago</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {drafts[app.id] && (
                  <button onClick={() => setExpanded(e => e === app.id ? null : app.id)}
                    className="text-xs text-muted-foreground hover:text-foreground">
                    {expanded === app.id ? "Hide" : "Show draft"}
                  </button>
                )}
                <button
                  onClick={() => drafts[app.id] ? copyDraft(app.id) : draftEmail(app.id)}
                  disabled={loading[app.id]}
                  className="flex items-center gap-1.5 rounded-lg bg-yellow-500/15 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/25 disabled:opacity-50"
                >
                  {loading[app.id] ? <Loader2 className="size-3 animate-spin" /> :
                    sent[app.id] ? <CheckCircle className="size-3" /> :
                    drafts[app.id] ? <CheckCircle className="size-3" /> :
                    <Mail className="size-3" />}
                  {loading[app.id] ? "Drafting…" : sent[app.id] ? "Copied!" : drafts[app.id] ? "Copy email" : "Draft email"}
                </button>
              </div>
            </div>
            {expanded === app.id && drafts[app.id] && (
              <div className="border-t border-border px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Subject</p>
                <p className="text-xs font-medium text-card-foreground mb-2">{drafts[app.id]!.subject}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Body</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{drafts[app.id]!.body}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function RejectionPatternSection({ pattern }: { pattern: RejectionPattern }) {
  if (!pattern) return null

  const entries = Object.entries(pattern.failedRounds).sort((a, b) => b[1] - a[1])
  const max = entries[0]?.[1] ?? 1

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="size-4 text-red-400" />
        <h3 className="text-sm font-semibold text-card-foreground">Rejection Patterns</h3>
        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
          {pattern.totalRejected} rejected · {pattern.rejectionRate}% rate
        </span>
      </div>

      {pattern.worstStage && (
        <p className="text-sm text-card-foreground mb-4">
          Most failures at <span className="font-semibold text-red-400">{pattern.worstStage}</span> — focus your prep there.
        </p>
      )}

      {entries.length > 0 && (
        <div className="flex flex-col gap-2">
          {entries.map(([stage, count]) => (
            <div key={stage}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-card-foreground">{stage}</span>
                <span className="text-xs text-muted-foreground">{count} failed</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
                <div className="h-full rounded-full bg-red-500/60" style={{ width: `${(count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground">Log interview round outcomes in the Interviews tab to see patterns here.</p>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const pathname = usePathname()

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" })
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [pathname, fetchData])

  return (
    <main className="min-h-svh bg-background">
      <AppHeader />
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Live data from your tracker</p>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8">Loading dashboard…</p>
        ) : data ? (
          <>
            <StatCards stats={data.stats} healthScore={data.healthScore} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ApplicationsBarChart data={data.applicationsPerWeek} />
              <ResponseRateLineChart data={data.responseRateTrend} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ApplicationFunnel stages={data.funnel} />
              <InsightCard insight={data.topInsight} />
            </div>
            {(data.staleApps?.length > 0 || data.rejectionPattern) && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {data.staleApps?.length > 0 && <FollowUpSection staleApps={data.staleApps} />}
                {data.rejectionPattern && <RejectionPatternSection pattern={data.rejectionPattern} />}
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  )
}
