import { ArrowDownRight, ArrowUpRight, Send, MailOpen, TrendingUp, Clock } from "lucide-react"
import { type StatCard } from "@/lib/dashboard-data"
import { HealthRing } from "@/components/health-ring"

const STAT_ICONS: Record<string, React.ElementType> = {
  "Total Applied":     Send,
  "Response Rate":     MailOpen,
  "Active Pipeline":   TrendingUp,
  "Avg. Days to Response": Clock,
}

const toneText: Record<string, string> = {
  good:    "text-[var(--chart-good)]",
  warn:    "text-[var(--chart-warn)]",
  bad:     "text-[var(--chart-bad)]",
  neutral: "text-foreground",
}

const toneBg: Record<string, string> = {
  good:    "bg-emerald-500/10 border-emerald-500/20",
  warn:    "bg-amber-500/10 border-amber-500/20",
  bad:     "bg-red-500/10 border-red-500/20",
  neutral: "bg-primary/10 border-primary/20",
}

const toneIcon: Record<string, string> = {
  good:    "text-emerald-400",
  warn:    "text-amber-400",
  bad:     "text-red-400",
  neutral: "text-primary",
}

function StatTile({ stat }: { stat: StatCard }) {
  const Icon = STAT_ICONS[stat.label] ?? TrendingUp
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className={`flex size-9 items-center justify-center rounded-xl border ${toneBg[stat.tone]}`}>
          <Icon className={`size-4 ${toneIcon[stat.tone]}`} />
        </div>
        {stat.delta ? (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
            stat.delta.direction === "up" ? "text-[var(--chart-good)]" : "text-[var(--chart-bad)]"
          }`}>
            {stat.delta.direction === "up"
              ? <ArrowUpRight className="size-3.5" aria-hidden />
              : <ArrowDownRight className="size-3.5" aria-hidden />}
            {stat.delta.value}
          </span>
        ) : null}
      </div>
      <div className="mt-5">
        <div className={`text-3xl font-extrabold tracking-tight tabular-nums ${toneText[stat.tone]}`}>
          {stat.value}
        </div>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground/60">{stat.sublabel}</p>
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {stats.map((stat) => (
        <StatTile key={stat.label} stat={stat} />
      ))}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 hover:border-border transition-colors">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-foreground">Health Score</span>
          <p className="mt-1 text-[11px] text-muted-foreground/70 leading-relaxed">
            Volume, follow-ups & response strength
          </p>
        </div>
        <HealthRing score={healthScore} size={88} stroke={9} />
      </div>
    </div>
  )
}
