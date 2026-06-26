import { JdAnalyzer } from "@/components/jd-analyzer"
import { Suspense } from "react"

export default function JdAnalyzerPage() {
  return (
    <div className="h-full flex flex-col min-h-0">
      <Suspense>
        <JdAnalyzer />
      </Suspense>
    </div>
  )
}
