"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { type Insight } from "@/lib/dashboard-data"

const CTA_ROUTES: Record<string, string> = {
  "Open War Room": "/war-room",
  "Go to Tracker": "/",
  "Review Applications": "/",
}

export function InsightCard({ insight }: { insight: Insight }) {
  const href = CTA_ROUTES[insight.cta] ?? "/"

  return (
    <div className="flex flex-col rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
          <Sparkles className="size-4 text-primary" aria-hidden />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-primary/80">
          AI Insight
        </span>
      </div>

      <h3 className="text-base font-bold text-foreground leading-snug">
        {insight.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground flex-1">
        {insight.body}
      </p>

      <div className="mt-5">
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_16px_oklch(0.64_0.22_262/25%)] transition-all hover:opacity-90 hover:shadow-[0_0_24px_oklch(0.64_0.22_262/40%)]"
        >
          {insight.cta}
        </Link>
      </div>
    </div>
  )
}
