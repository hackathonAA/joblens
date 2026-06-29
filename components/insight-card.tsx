"use client"

import Link from "next/link"
import { Lightbulb } from "lucide-react"
import { type Insight } from "@/lib/dashboard-data"

const CTA_ROUTES: Record<string, string> = {
  "Open War Room": "/war-room",
  "Go to Tracker": "/tracker",
  "Review Applications": "/tracker",
}

export function InsightCard({ insight }: { insight: Insight }) {
  const href = CTA_ROUTES[insight.cta] ?? "/"

  return (
    <div className="flex flex-col rounded-xl border border-[var(--chart-bad)]/30 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-[var(--chart-bad)]/15 text-[var(--chart-bad)]">
          <Lightbulb className="size-4" aria-hidden />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--chart-bad)]">
          Top insight
        </span>
      </div>

      <h3 className="text-base font-semibold text-foreground text-balance">
        {insight.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {insight.body}
      </p>

      <div className="mt-auto pt-5">
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {insight.cta}
        </Link>
      </div>
    </div>
  )
}
