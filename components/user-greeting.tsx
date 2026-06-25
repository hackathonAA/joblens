"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { LogOut, User, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function UserGreeting() {
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

  // Close on outside click
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
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    const region = process.env.NEXT_PUBLIC_COGNITO_REGION ?? "us-east-1"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
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
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
          {initials}
        </span>
        <span className="max-w-28 truncate">{display}</span>
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-card shadow-lg">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-card-foreground transition-colors hover:bg-secondary rounded-t-lg"
          >
            <User className="size-3.5 text-muted-foreground" />
            View Profile
          </Link>
          <div className="border-t border-border" />
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-secondary rounded-b-lg"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
