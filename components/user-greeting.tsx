"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"

export function UserGreeting() {
  const { data: session } = useSession()
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user) return
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => {
        setName(data.name ?? data.username ?? data.email ?? null)
      })
      .catch(() => {
        setName(session.user?.name ?? session.user?.email ?? null)
      })
  }, [session])

  if (!session?.user) return null

  const display = name ?? session.user.name ?? session.user.email ?? "User"
  const initials = display.slice(0, 2).toUpperCase()

  return (
    <Link
      href="/profile"
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
        {initials}
      </span>
      <span className="max-w-32 truncate">{display}</span>
    </Link>
  )
}
