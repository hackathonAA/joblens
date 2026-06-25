export type StatTone = "good" | "warn" | "bad" | "neutral"

export type StatCard = {
  label: string
  value: string
  sublabel: string
  delta?: { value: string; direction: "up" | "down" }
  tone: StatTone
}

export const stats: StatCard[] = [
  {
    label: "Total Applications",
    value: "34",
    sublabel: "across 6 active pipelines",
    delta: { value: "+5 this week", direction: "up" },
    tone: "neutral",
  },
  {
    label: "Response Rate",
    value: "18%",
    sublabel: "6 of 34 got a reply",
    delta: { value: "+3% vs last month", direction: "up" },
    tone: "warn",
  },
  {
    label: "Interview Conversion",
    value: "42%",
    sublabel: "screens that advanced",
    delta: { value: "-8% vs last month", direction: "down" },
    tone: "good",
  },
]

// Search Health Score (0–100)
export const healthScore = 74

// Applications per week — last 8 weeks
export const applicationsPerWeek = [
  { week: "W1", applications: 2 },
  { week: "W2", applications: 5 },
  { week: "W3", applications: 4 },
  { week: "W4", applications: 7 },
  { week: "W5", applications: 3 },
  { week: "W6", applications: 6 },
  { week: "W7", applications: 2 },
  { week: "W8", applications: 5 },
]

// Response rate trend — last 8 weeks (percent)
export const responseRateTrend = [
  { week: "W1", rate: 0 },
  { week: "W2", rate: 20 },
  { week: "W3", rate: 12 },
  { week: "W4", rate: 14 },
  { week: "W5", rate: 22 },
  { week: "W6", rate: 17 },
  { week: "W7", rate: 25 },
  { week: "W8", rate: 18 },
]

export type FunnelStage = {
  stage: string
  count: number
}

// Application funnel: Applied → Screened → Technical → Final → Offer
export const funnel: FunnelStage[] = [
  { stage: "Applied", count: 34 },
  { stage: "Screened", count: 14 },
  { stage: "Technical", count: 8 },
  { stage: "Final", count: 3 },
  { stage: "Offer", count: 2 },
]

export type Insight = {
  title: string
  body: string
  cta: string
  tone: StatTone
}

export const topInsight: Insight = {
  title: "Your technical rounds are the leak",
  body: "You've been rejected 3x at the technical round — all involved system design. That's the single biggest drop-off in your funnel. Targeted prep here could meaningfully lift your offer rate.",
  cta: "Review Interview Logs",
  tone: "bad",
}
