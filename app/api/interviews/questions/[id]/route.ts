import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { users, interviewQuestions } from "@/lib/schema"
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

// PATCH /api/interviews/questions/[id]
// body: { whatISaid?, topicTag? }
// If whatISaid is provided, also runs AI evaluation → sets rating + aiRatingReason
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const [existing] = await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, id))
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const patch: Record<string, any> = {}
  if (body.topicTag !== undefined) patch.topicTag = body.topicTag
  if (body.question !== undefined && body.question.trim()) patch.question = body.question.trim()

  if (body.whatISaid !== undefined && body.whatISaid.trim()) {
    patch.whatISaid = body.whatISaid.trim()

    // AI evaluation of user's answer
    const prompt = `You are an expert interview coach evaluating a candidate's answer.

Question: "${existing.question}"

Model answer (what a great candidate would say):
${existing.aiAnswer ?? "Not available"}

Candidate's actual answer:
${body.whatISaid.trim()}

Rate the candidate's answer on a scale of 1-10 where:
- 1-3: Poor (missed the point, too vague, or inaccurate)
- 4-6: Average (correct but shallow, lacks specifics or structure)
- 7-8: Good (clear, structured, covers key points)
- 9-10: Excellent (comprehensive, specific, impressive delivery)

Return ONLY valid JSON with two keys:
"rating": a number 1-10
"reason": 1-2 sentences explaining the rating, mentioning what was done well and what could be improved`

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
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        patch.rating = Math.min(10, Math.max(1, Math.round(result.rating ?? 5)))
        patch.aiRatingReason = result.reason ?? ""
      }
    } catch {
      // don't fail the whole request if AI eval fails
    }
  }

  const [updated] = await db.update(interviewQuestions).set(patch).where(eq(interviewQuestions.id, id)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(interviewQuestions).where(eq(interviewQuestions.id, id))
  return NextResponse.json({ success: true })
}
