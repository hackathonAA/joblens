import { AppHeader } from "@/components/app-header"
import { JdAnalyzer } from "@/components/jd-analyzer"
import { Suspense } from "react"

export default function JdAnalyzerPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">JD Analyzer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste any job description — AI extracts required skills, red flags, and scores your fit.
          </p>
        </div>
        <Suspense>
          <JdAnalyzer />
        </Suspense>
      </main>
    </div>
  )
}
