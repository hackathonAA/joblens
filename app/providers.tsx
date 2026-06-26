"use client"

import { SessionProvider } from "next-auth/react"
import { ColumnsProvider } from "@/lib/columns-context"
import { CurrencyProvider } from "@/lib/currency-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <ColumnsProvider>
          {children}
        </ColumnsProvider>
      </CurrencyProvider>
    </SessionProvider>
  )
}
