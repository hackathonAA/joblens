"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type WeekBar = { week: string; applications: number }
type WeekRate = { week: string; rate: number }

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="h-56 w-full">{children}</div>
    </div>
  )
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  color: "var(--popover-foreground)",
  fontSize: "12px",
}

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
}

export function ApplicationsBarChart({ data }: { data: WeekBar[] }) {
  return (
    <ChartCard
      title="Applications per week"
      subtitle="Last 8 weeks of activity"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="week" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} width={32} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={tooltipStyle}
          />
          <Bar
            dataKey="applications"
            fill="var(--chart-accent)"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function ResponseRateLineChart({ data }: { data: WeekRate[] }) {
  return (
    <ChartCard
      title="Response rate trend"
      subtitle="Share of applications that got a reply"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="week" {...axisProps} />
          <YAxis
            {...axisProps}
            width={40}
            tickFormatter={(v) => `${v}%`}
            domain={[0, "dataMax + 5"]}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            contentStyle={tooltipStyle}
            formatter={(value: number) => [`${value}%`, "Response rate"]}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--chart-good)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--chart-good)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
