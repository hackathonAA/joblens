"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"

const NO_SIDEBAR_ROUTES = ["/login"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideSidebar = NO_SIDEBAR_ROUTES.includes(pathname)

  if (hideSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex h-svh overflow-hidden">
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
