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

// POST /api/interviews/questions
// body: { roundId, question, topicTag? }
// Returns the saved question + AI's model answer
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { roundId, question, topicTag } = body

  if (!roundId || !question?.trim()) {
    return NextResponse.json({ error: "roundId and question are required" }, { status: 400 })
  }

  // Verify round belongs to user
  const [round] = await db.select().from(interviewRounds).where(eq(interviewRounds.id, roundId))
  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 })

  // Generate AI model answer
  const prompt = `You are an experienced software engineer and career coach. A job candidate is preparing for an interview.

Round type: ${round.roundType}
Question asked: "${question}"${topicTag ? `\nTopic: ${topicTag}` : ""}

Provide a strong, concise model answer for this question as if you were an ideal candidate answering it.
- Be specific and use the STAR method (Situation, Task, Action, Result) for behavioral questions
- For technical questions, explain concepts clearly and show depth
- Keep the answer to 3-5 sentences or bullet points max
- Sound natural and confident, not robotic

Return ONLY the answer text, no preamble.`

  let aiAnswer = ""
  try {
    const command = new InvokeModelCommand({
      modelId: "amazon.nova-pro-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 512 },
      }),
    })
    const response = await bedrock.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    aiAnswer = responseBody.output?.message?.content?.[0]?.text ?? ""
  } catch {
    aiAnswer = ""
  }

  const [saved] = await db.insert(interviewQuestions).values({
    roundId,
    question: question.trim(),
    topicTag: topicTag ?? null,
    aiAnswer: aiAnswer || null,
  }).returning()

  return NextResponse.json(saved, { status: 201 })
}
