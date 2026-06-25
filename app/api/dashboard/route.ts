import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { applications, users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getUserColumns } from "@/lib/column-defaults"

export const dynamic = "force-dynamic"

async function getUser(session: any) {
  if (!session?.user?.id) return null
  const [user] = await db.select().from(users).where(eq(users.cognitoSub, session.user.id))
  return user ?? null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [apps, cols] = await Promise.all([
    db.select().from(applications).where(eq(applications.userId, user.id)),
    getUserColumns(user.id),
  ])

  const colsByKey = new Map(cols.map(c => [c.columnKey, c]))
  const rejectedKeys   = new Set(cols.filter(c => c.isRejected).map(c => c.columnKey))
  const defaultKey     = cols.find(c => c.isDefault)?.columnKey ?? cols[0]?.columnKey ?? ""
  const offerKeys      = new Set(cols.filter(c => c.isOfferStage).map(c => c.columnKey))
  const screenedKeys   = new Set(cols.filter(c => c.isInterviewEligible || c.isOfferStage).map(c => c.columnKey))
  // "reached technical" = all interview-eligible columns except the first one (recruiter screen) + offer stages
  const interviewEligible = cols.filter(c => c.isInterviewEligible).sort((a, b) => a.position - b.position)
  const deepScreenKeys = new Set([
    ...interviewEligible.slice(1).map(c => c.columnKey),
    ...cols.filter(c => c.isOfferStage).map(c => c.columnKey),
  ])

  const total = apps.length
  const byStatus = (s: string) => apps.filter(a => a.status === s).length
  const rejected = apps.filter(a => rejectedKeys.has(a.status ?? ""))
  const offerCount = apps.filter(a => offerKeys.has(a.status ?? "")).length
  const gotResponse = apps.filter(a => a.status !== defaultKey).length
  const responseRate = total > 0 ? Math.round((gotResponse / total) * 100) : 0
  const screened = apps.filter(a => screenedKeys.has(a.status ?? "")).length
  const reachedDeep = apps.filter(a => deepScreenKeys.has(a.status ?? "")).length
  const interviewConversion = screened > 0 ? Math.round((reachedDeep / screened) * 100) : 0

  // Weekly charts — last 8 weeks oldest→newest
  const now = new Date()
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weeksAgo = 7 - i
    const weekEnd = new Date(now); weekEnd.setDate(now.getDate() - weeksAgo * 7 + 7)
    const weekStart = new Date(weekEnd); weekStart.setDate(weekEnd.getDate() - 7)
    const count = apps.filter(a => { const d = new Date(a.appliedAt ?? ""); return d >= weekStart && d < weekEnd }).length
    const label = weeksAgo === 0 ? "This wk" : weeksAgo === 1 ? "Last wk" : `${weeksAgo}w ago`
    return { week: label, applications: count }
  })

  const responseTrend = Array.from({ length: 8 }, (_, i) => {
    const weeksAgo = 7 - i
    const weekEnd = new Date(now); weekEnd.setDate(now.getDate() - weeksAgo * 7 + 7)
    const weekStart = new Date(weekEnd); weekStart.setDate(weekEnd.getDate() - 7)
    const weekApps = apps.filter(a => { const d = new Date(a.appliedAt ?? ""); return d >= weekStart && d < weekEnd })
    const rate = weekApps.length > 0 ? Math.round((weekApps.filter(a => a.status !== defaultKey).length / weekApps.length) * 100) : 0
    const label = weeksAgo === 0 ? "This wk" : weeksAgo === 1 ? "Last wk" : `${weeksAgo}w ago`
    return { week: label, rate }
  })

  // Dynamic funnel from ordered non-rejected columns
  const funnelCols = cols.filter(c => !c.isRejected).sort((a, b) => a.position - b.position)
  const funnel = funnelCols.map((col, idx) => ({
    stage: col.title,
    count: apps.filter(a => {
      const appColIdx = funnelCols.findIndex(fc => fc.columnKey === (a.status ?? ""))
      return appColIdx >= idx
    }).length,
  }))

  // Health score
  const responseScore = Math.min(responseRate / 30, 1) * 40
  const conversionScore = Math.min(interviewConversion / 50, 1) * 40
  const activityScore = Math.min(total / 10, 1) * 20
  const healthScore = Math.round(responseScore + conversionScore + activityScore)

  // Insight
  const drops = funnel.slice(1).map((stage, i) => ({
    from: funnel[i].stage, to: stage.stage,
    drop: funnel[i].count > 0 ? (funnel[i].count - stage.count) / funnel[i].count : 0,
  }))
  const biggestDrop = drops.reduce((a, b) => b.drop > a.drop ? b : a, drops[0] ?? { from: "", to: "", drop: 0 })

  let insightTitle = "Your pipeline is healthy"
  let insightBody = `${total} application${total !== 1 ? "s" : ""} tracked. Response rate ${responseRate}%, interview conversion ${interviewConversion}%.`
  let insightTone: "good" | "warn" | "bad" | "neutral" = "good"

  if (total === 0) {
    insightTitle = "Start adding applications"
    insightBody = "Add your first job application in the Tracker to start seeing insights here."
    insightTone = "neutral"
  } else if (biggestDrop?.drop > 0.6 && biggestDrop.from) {
    insightTitle = `${biggestDrop.from} → ${biggestDrop.to} is your biggest drop-off`
    insightBody = `${Math.round(biggestDrop.drop * 100)}% are not advancing past ${biggestDrop.from}. Focus on improving this stage.`
    insightTone = "bad"
  } else if (responseRate < 20 && total >= 5) {
    insightTitle = "Low response rate — consider revising your resume"
    insightBody = `Only ${responseRate}% of your ${total} applications got a reply.`
    insightTone = "warn"
  } else if (offerCount > 0) {
    insightTitle = `${offerCount} offer${offerCount > 1 ? "s" : ""} in hand!`
    insightBody = `You've reached the offer stage ${offerCount} time${offerCount > 1 ? "s" : ""}. Head to the War Room to compare them.`
    insightTone = "good"
  }

  return NextResponse.json({
    stats: [
      { label: "Total Applications", value: String(total), sublabel: `${rejected.length} rejected · ${offerCount} offer${offerCount !== 1 ? "s" : ""}`, tone: "neutral" },
      { label: "Response Rate", value: `${responseRate}%`, sublabel: `${gotResponse} of ${total} got a reply`, tone: responseRate >= 30 ? "good" : responseRate >= 15 ? "warn" : "bad" },
      { label: "Interview Conversion", value: `${interviewConversion}%`, sublabel: `${reachedDeep} of ${screened} screened advanced`, tone: interviewConversion >= 50 ? "good" : interviewConversion >= 25 ? "warn" : "bad" },
    ],
    breakdown: Object.fromEntries(cols.map(c => [c.columnKey, byStatus(c.columnKey)])),
    healthScore,
    applicationsPerWeek: weeklyData,
    responseRateTrend: responseTrend,
    funnel,
    topInsight: { title: insightTitle, body: insightBody, cta: total === 0 ? "Go to Tracker" : offerCount > 0 ? "Open War Room" : "Review Applications", tone: insightTone },
  })
}
