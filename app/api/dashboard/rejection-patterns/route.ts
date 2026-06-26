import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { users, applications, interviewRounds } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getUserColumns } from "@/lib/column-defaults"
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"

export const dynamic = "force-dynamic"

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

async function getUser(session: any) {
  if (!session?.user?.id) return null
  const [user] = await db.select().from(users).where(eq(users.cognitoSub, session.user.id))
  return user ?? null
}

export async function POST() {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [cols, apps, rounds] = await Promise.all([
    getUserColumns(user.id),
    db.select().from(applications).where(eq(applications.userId, user.id)),
    db.select().from(interviewRounds),
  ])

  const rejectedKeys = new Set(cols.filter(c => c.isRejected).map(c => c.columnKey))
  const rejectedApps = apps.filter(a => rejectedKeys.has(a.status ?? ""))

  if (rejectedApps.length < 2) {
    return NextResponse.json({
      worstStage: null,
      pattern: null,
      suggestion: null,
      stageCounts: [],
    })
  }

  // Count rejections by stage (the stage they were in when rejected — use their current status)
  const stageCounts: Record<string, number> = {}
  for (const col of cols.filter(c => !c.isRejected)) {
    stageCounts[col.title] = 0
  }
  // For rejected apps, count based on which non-rejected stage had most rejections
  // Approximate: look at interview round failures
  const appIds = new Set(apps.map(a => a.id))
  const userRounds = rounds.filter(r => appIds.has(r.applicationId))
  const failedRounds: Record<string, number> = {}
  for (const round of userRounds) {
    if (round.outcome === "failed") {
      failedRounds[round.roundType] = (failedRounds[round.roundType] ?? 0) + 1
    }
  }

  const worstStage = Object.entries(failedRounds).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const totalRejected = rejectedApps.length
  const totalApps = apps.length

  const summaryText = `
Total applications: ${totalApps}
Total rejected: ${totalRejected} (${Math.round((totalRejected / totalApps) * 100)}%)
Failed interview rounds by type: ${JSON.stringify(failedRounds)}
Rejection rate: ${Math.round((totalRejected / totalApps) * 100)}%
${worstStage ? `Most failures at: ${worstStage} round` : ""}
`.trim()

  const prompt = `You are a career coach analyzing a job seeker's rejection patterns.

Data:
${summaryText}

Based on this data, provide a short, actionable analysis. Return ONLY valid JSON:
{
  "worstStage": "${worstStage ?? "Application"}",
  "pattern": "1 sentence describing the main rejection pattern",
  "suggestion": "1-2 sentences with a specific, actionable improvement tip"
}`

  try {
    const command = new InvokeModelCommand({
      modelId: "amazon.nova-pro-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 256 },
      }),
    })
    const response = await bedrock.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    const content = responseBody.output?.message?.content?.[0]?.text ?? ""
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON")
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ ...result, failedRounds, totalRejected, totalApps })
  } catch {
    return NextResponse.json({
      worstStage,
      pattern: `${totalRejected} of ${totalApps} applications were rejected.`,
      suggestion: worstStage ? `You have the most failures at the ${worstStage} stage. Focus your preparation there.` : "Keep applying and tracking patterns.",
      failedRounds,
      totalRejected,
      totalApps,
    })
  }
}
