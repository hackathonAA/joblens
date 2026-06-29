import { type FunnelStage } from "@/lib/dashboard-data"

export function ApplicationFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = stages[0]?.count || 1

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Application funnel
        </h3>
        <p className="text-xs text-muted-foreground">
          Stage-by-stage conversion with drop-off
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {stages.map((stage, i) => {
          const widthPct = Math.max((stage.count / max) * 100, 8)
          const prev = stages[i - 1]
          const dropOff = prev && prev.count > 0
            ? Math.round(((prev.count - stage.count) / prev.count) * 100)
            : null

          return (
            <div key={stage.stage}>
              {dropOff !== null ? (
                <div className="flex items-center justify-end py-0.5 pr-1">
                  <span className="text-[11px] font-medium text-[var(--chart-bad)]">
                    -{dropOff}% drop-off
                  </span>
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm text-muted-foreground">
                  {stage.stage}
                </span>
                <div className="relative h-9 flex-1 overflow-hidden rounded-md bg-muted/50">
                  <div
                    className="flex h-full items-center rounded-md bg-[var(--chart-accent)] px-3 transition-all duration-700 ease-out"
                    style={{ width: `${widthPct}%` }}
                  >
                    <span className="text-sm font-semibold text-primary-foreground tabular-nums">
                      {stage.count}
                    </span>
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
