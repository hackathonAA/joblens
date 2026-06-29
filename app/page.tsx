import { AppHeader } from "@/components/app-header"
import { KanbanBoard } from "@/components/kanban-board"

export default function Page() {
  return (
    <main className="min-h-svh bg-background">
      <AppHeader />
      <div className="px-6 py-5">
        <KanbanBoard />
      </div>
    </main>
  )
}
