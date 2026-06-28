"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  BarChart2,
  Swords,
  MessageSquare,
  ScanText,
  FileSearch,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useCurrency, CURRENCIES } from "@/lib/currency-context"

const NAV_ITEMS = [
  { href: "/",                  label: "Tracker",       icon: LayoutGrid   },
  { href: "/dashboard",         label: "Dashboard",     icon: BarChart2    },
  { href: "/war-room",          label: "War Room",      icon: Swords       },
  { href: "/interview-logger",  label: "Interviews",    icon: MessageSquare },
  { href: "/jd-analyzer",       label: "JD Analyzer",   icon: ScanText     },
  { href: "/offer-analyzer",    label: "Offer Analyzer",icon: FileSearch   },
]

function UserSection() {
  const { data: session } = useSession()
  const [name, setName] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session?.user) return
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => setName(data.name ?? data.username ?? data.email ?? null))
      .catch(() => setName(session.user?.name ?? session.user?.email ?? null))
  }, [session])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (!session?.user) return null

  const display = name ?? session.user.name ?? session.user.email ?? "User"
  const initials = display.slice(0, 2).toUpperCase()

  function handleSignOut() {
    const domain    = process.env.NEXT_PUBLIC_COGNITO_DOMAIN
    const clientId  = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    const region    = process.env.NEXT_PUBLIC_COGNITO_REGION ?? "us-east-1"
    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    signOut({ redirect: false }).then(() => {
      if (domain && clientId) {
        window.location.href = `https://${domain}.auth.${region}.amazoncognito.com/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(`${appUrl}/login`)}`
      } else {
        window.location.href = "/login"
      }
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs transition-colors hover:bg-sidebar-accent border-l-2 border-transparent hover:border-muted-foreground"
      >
        <span className="flex size-6 shrink-0 items-center justify-center border border-primary/40 text-[10px] font-bold text-primary bg-primary/10">
          {initials}
        </span>
        <span className="min-w-0 flex-1 truncate text-left text-xs font-medium text-sidebar-foreground">
          {display}
        </span>
        <ChevronDown className={cn("size-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-0 border border-sidebar-border bg-popover shadow-xl shadow-black/60">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-popover-foreground transition-colors hover:bg-accent hover:text-primary"
          >
            <User className="size-3.5 text-muted-foreground" />
            View Profile
          </Link>
          <div className="border-t border-border" />
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-destructive transition-colors hover:bg-accent"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { currency, setCurrency } = useCurrency()

  return (
    <aside className="flex h-svh w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <rect width="18" height="18" fill="oklch(0.78 0.17 85)" />
          <rect x="4" y="4" width="5" height="5" fill="oklch(0.06 0 0)" />
          <rect x="11" y="10" width="3" height="4" fill="oklch(0.06 0 0)" />
        </svg>
        <span className="text-sm font-bold tracking-widest uppercase text-sidebar-foreground">JobLens</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-px px-0 py-3" aria-label="Main navigation">
        <p className="label-caps mb-2 px-5 text-muted-foreground">// workspace</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-2.5 px-5 py-2 text-xs font-medium tracking-wide transition-colors border-l-2",
                active
                  ? "border-primary bg-sidebar-accent text-primary"
                  : "border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-muted-foreground",
              )}
            >
              <Icon className={cn("size-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: currency + user */}
      <div className="border-t border-sidebar-border px-3 py-3 flex flex-col gap-1">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="label-caps text-muted-foreground">CCY</span>
          <select
            value={currency.code}
            onChange={e => { const c = CURRENCIES.find(c => c.code === e.target.value); if (c) setCurrency(c) }}
            className="border border-border bg-transparent py-0.5 pl-1 pr-5 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus:ring-1 focus:ring-primary cursor-pointer"
            title="Currency"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
        <UserSection />
      </div>
    </aside>
  )
}
