"use client"

import { SessionProvider } from "next-auth/react"
import { ColumnsProvider } from "@/lib/columns-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ColumnsProvider>
        {children}
      </ColumnsProvider>
    </SessionProvider>
  )
}
