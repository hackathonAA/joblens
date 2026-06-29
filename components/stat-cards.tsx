import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { type StatCard } from "@/lib/dashboard-data"
import { HealthRing } from "@/components/health-ring"

const toneText: Record<string, string> = {
  good: "text-[var(--chart-good)]",
  warn: "text-[var(--chart-warn)]",
  bad: "text-[var(--chart-bad)]",
  neutral: "text-foreground",
}

function StatTile({ stat }: { stat: StatCard }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {stat.label}
        </span>
        {stat.delta ? (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              stat.delta.direction === "up"
                ? "text-[var(--chart-good)]"
                : "text-[var(--chart-bad)]"
            }`}
          >
            {stat.delta.direction === "up" ? (
              <ArrowUpRight className="size-3.5" aria-hidden />
            ) : (
              <ArrowDownRight className="size-3.5" aria-hidden />
            )}
            {stat.delta.value}
          </span>
        ) : null}
      </div>
      <div className="mt-6">
        <div className={`text-4xl font-bold tracking-tight ${toneText[stat.tone]}`}>
          {stat.value}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{stat.sublabel}</p>
      </div>
    </div>
  )
}

export function StatCards({
  stats,
  healthScore,
}: {
  stats: StatCard[]
  healthScore: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatTile key={stat.label} stat={stat} />
      ))}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            Search Health Score
          </span>
          <p className="mt-2 text-sm text-muted-foreground">
            Volume, follow-ups, and response strength combined.
          </p>
        </div>
        <HealthRing score={healthScore} size={104} stroke={10} />
      </div>
    </div>
  )
}
