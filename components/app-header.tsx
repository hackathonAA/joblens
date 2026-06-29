"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserGreeting } from "@/components/user-greeting"
import { useCurrency, CURRENCIES } from "@/lib/currency-context"

const NAV_ITEMS = [
  { href: "/dashboard",         label: "Dashboard" },
  { href: "/tracker",           label: "Tracker" },
  { href: "/offer-analyzer",    label: "Offer Analyzer" },
  { href: "/war-room",          label: "War Room" },
  { href: "/interview-logger",  label: "Interviews" },
  { href: "/jd-analyzer",       label: "JD Analyzer" },
]

const SUBTITLES: Record<string, string> = {
  "/dashboard":       "Search velocity dashboard — your job hunt, measured.",
  "/tracker":         "Track every application across your job search pipeline.",
  "/offer-analyzer":  "Decode your offer letter, clause by clause — in plain English.",
  "/war-room":        "Compare offers side by side and pick the best one.",
  "/interview-logger":"Log every round, spot your patterns.",
  "/jd-analyzer":     "Paste any JD — AI extracts skills, flags, and scores your fit.",
}

export function AppHeader() {
  const pathname = usePathname()
  const { currency, setCurrency } = useCurrency()

  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-6 py-5">
      <div>
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary" aria-hidden />
          <h1 className="text-lg font-bold tracking-tight text-foreground">JobLens</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {SUBTITLES[pathname] ?? "Your job search OS."}
        </p>
      </div>
      <nav className="flex flex-wrap items-center gap-1 text-sm">
        {NAV_ITEMS.map(item =>
          item.href === pathname ? (
            <span key={item.href} className="rounded-md bg-secondary px-3 py-1.5 font-medium text-secondary-foreground">
              {item.label}
            </span>
          ) : (
            <Link key={item.href} href={item.href}
              className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground">
              {item.label}
            </Link>
          )
        )}
        <select
          value={currency.code}
          onChange={e => { const c = CURRENCIES.find(c => c.code === e.target.value); if (c) setCurrency(c) }}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus:ring-1 focus:ring-primary cursor-pointer"
          title="Currency"
        >
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        <UserGreeting />
      </nav>
    </header>
  )
}
