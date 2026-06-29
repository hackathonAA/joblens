"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserGreeting } from "@/components/user-greeting"
import { useCurrency, CURRENCIES } from "@/lib/currency-context"
import { cn } from "@/lib/utils"
import { Telescope } from "lucide-react"

const NAV_ITEMS = [
  { href: "/",                  label: "Tracker" },
  { href: "/offer-analyzer",    label: "Offer Analyzer" },
  { href: "/war-room",          label: "War Room" },
  { href: "/dashboard",         label: "Dashboard" },
  { href: "/interview-logger",  label: "Interviews" },
  { href: "/jd-analyzer",       label: "JD Analyzer" },
]

export function AppHeader() {
  const pathname = usePathname()
  const { currency, setCurrency } = useCurrency()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-[0_0_12px_oklch(0.64_0.22_262/40%)] transition-shadow group-hover:shadow-[0_0_18px_oklch(0.64_0.22_262/60%)]">
            <Telescope className="size-4 text-primary-foreground" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            Job<span className="text-primary">Lens</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5 rounded-xl bg-secondary/50 p-1 border border-border/40">
          {NAV_ITEMS.map(item => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return active ? (
              <span
                key={item.href}
                className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground shadow-sm"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={currency.code}
            onChange={e => { const c = CURRENCIES.find(c => c.code === e.target.value); if (c) setCurrency(c) }}
            className="rounded-lg border border-border/60 bg-secondary/50 px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground outline-none hover:text-foreground focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
            title="Currency"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <UserGreeting />
        </div>
      </div>
    </header>
  )
}
