import { cn } from "@/lib/utils"

export function TwoZone({
  left,
  children,
  className,
}: {
  left: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex h-full min-h-0", className)}>
      <aside className="w-[340px] shrink-0 flex flex-col overflow-y-auto border-r border-border bg-sidebar">
        {left}
      </aside>
      <main className="flex flex-1 flex-col overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
