import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { users, interviewRounds, interviewQuestions } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"

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

// POST /api/interviews/[id]/confidence
// Computes the round-level confidence score based on all rated questions
// Also accepts overallExperience text from user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { overallExperience } = body

  const [round] = await db.select().from(interviewRounds).where(eq(interviewRounds.id, id))
  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 })

  const questions = await db.select().from(interviewQuestions).where(eq(interviewQuestions.roundId, id))

  const ratedQuestions = questions.filter(q => q.rating != null && q.whatISaid)

  const questionSummary = ratedQuestions.map(q => `
Q: ${q.question}
Candidate said: ${q.whatISaid}
Rating: ${q.rating}/10 — ${q.aiRatingReason ?? ""}
`.trim()).join("\n\n")

  const prompt = `You are an expert interview coach giving final feedback on a candidate's ${round.roundType} interview round.

${ratedQuestions.length > 0 ? `Performance on ${ratedQuestions.length} question(s):\n\n${questionSummary}` : "No questions were individually rated."}

${overallExperience ? `Candidate's overall experience note:\n"${overallExperience}"` : ""}

${questions.length === 0 ? "No questions were logged for this round." : ""}

Based on all available information, provide a confidence score (0-100) representing the candidate's chances of clearing this round:
- 0-30: Very unlikely to pass — major gaps in answers or very poor delivery
- 31-50: Below average — some correct answers but significant weaknesses
- 51-70: Average — passable but not impressive
- 71-85: Good — solid performance, likely to move forward
- 86-100: Excellent — strong answers, very likely to advance

Return ONLY valid JSON with two keys:
"score": number 0-100
"reason": 2-3 sentences explaining the score, including specific strengths and areas to improve`

  try {
    const command = new InvokeModelCommand({
      modelId: "amazon.nova-pro-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 300 },
      }),
    })
    const response = await bedrock.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    const content = responseBody.output?.message?.content?.[0]?.text ?? ""
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")

    const result = JSON.parse(jsonMatch[0])
    const score = Math.min(100, Math.max(0, Math.round(result.score ?? 50)))
    const reason = result.reason ?? ""

    const patch: Record<string, any> = { confidenceScore: score, confidenceReason: reason }
    if (overallExperience !== undefined) patch.overallExperience = overallExperience

    await db.update(interviewRounds).set(patch).where(eq(interviewRounds.id, id))

    return NextResponse.json({ score, reason })
  } catch {
    // Fallback: average of individual ratings * 10 if AI fails
    const avg = ratedQuestions.length > 0
      ? Math.round(ratedQuestions.reduce((s, q) => s + (q.rating ?? 5), 0) / ratedQuestions.length * 10)
      : 50
    await db.update(interviewRounds).set({ confidenceScore: avg }).where(eq(interviewRounds.id, id))
    return NextResponse.json({ score: avg, reason: "Computed from individual question ratings." })
  }
}
