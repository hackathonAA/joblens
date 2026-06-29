import { type FunnelStage } from "@/lib/dashboard-data"
import { cn } from "@/lib/utils"

const BAR_COLORS = [
  "bg-primary",
  "bg-violet-500",
  "bg-sky-500",
  "bg-teal-500",
  "bg-amber-500",
  "bg-red-500",
]

export function ApplicationFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = stages[0]?.count || 1

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-foreground">Application Funnel</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Stage-by-stage conversion with drop-off</p>
      </div>

      <div className="flex flex-col gap-3">
        {stages.map((stage, i) => {
          const widthPct = Math.max((stage.count / max) * 100, 6)
          const prev = stages[i - 1]
          const dropOff = prev && prev.count > 0
            ? Math.round(((prev.count - stage.count) / prev.count) * 100)
            : null
          const barColor = BAR_COLORS[i % BAR_COLORS.length]

          return (
            <div key={stage.stage}>
              {dropOff !== null && (
                <div className="flex items-center justify-end pb-1 pr-1">
                  <span className="text-[10px] font-semibold text-[var(--chart-bad)]/80">
                    −{dropOff}% drop-off
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[11px] font-medium text-muted-foreground truncate">
                  {stage.stage}
                </span>
                <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-secondary/40">
                  <div
                    className={cn("flex h-full items-center rounded-lg px-3 transition-all duration-700 ease-out", barColor)}
                    style={{ width: `${widthPct}%` }}
                  >
                    <span className="text-xs font-bold text-white tabular-nums">{stage.count}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
