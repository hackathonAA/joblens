"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { ColumnsProvider } from "@/lib/columns-context"
import { CurrencyProvider } from "@/lib/currency-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      router.replace("/login")
    }
  }, [status, pathname, router])

  if (status === "loading") {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === "unauthenticated" && pathname !== "/login") return null

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <ColumnsProvider>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </ColumnsProvider>
      </CurrencyProvider>
    </SessionProvider>
  )
}
