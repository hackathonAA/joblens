import { AppHeader } from "@/components/app-header"
import { InterviewLogger } from "@/components/interview-logger"

export default function InterviewLoggerPage() {
  return (
    <main className="min-h-svh bg-background">
      <AppHeader />
      <div className="mx-auto max-w-6xl px-6 py-6">
        <InterviewLogger />
      </div>
    </main>
  )
}
