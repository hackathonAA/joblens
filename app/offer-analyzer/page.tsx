import { AppHeader } from "@/components/app-header"
import { OfferAnalyzer } from "@/components/offer-analyzer"

export default function OfferAnalyzerPage() {
  return (
    <main className="flex h-svh flex-col bg-background">
      <AppHeader />
      <div className="min-h-0 flex-1 px-6 py-6">
        <OfferAnalyzer />
      </div>
    </main>
  )
}
