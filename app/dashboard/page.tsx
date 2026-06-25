"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { ApplicationsBarChart, ResponseRateLineChart } from "@/components/dashboard-charts"
import { ApplicationFunnel } from "@/components/application-funnel"
import { InsightCard } from "@/components/insight-card"
import { StatCards } from "@/components/stat-cards"

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

  // Re-fetch every time user navigates to this page
  useEffect(() => {
    fetchData()
  }, [pathname, fetchData])

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
          </>
        ) : null}
      </div>
    </main>
  )
}
