import { AppHeader } from "@/components/app-header"
import { WarRoom } from "@/components/war-room"

export default function WarRoomPage() {
  return (
    <main className="min-h-svh bg-background">
      <AppHeader />
      <div className="mx-auto max-w-6xl px-6 py-6">
        <WarRoom />
      </div>
    </main>
  )
}
