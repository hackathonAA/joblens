import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { users, applications, followUps } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [app] = await db.select().from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)))
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 })

  const daysSince = Math.floor((Date.now() - new Date(app.updatedAt ?? app.appliedAt ?? Date.now()).getTime()) / 86400000)

  const prompt = `Write a concise, professional follow-up email for a job application.

Candidate: ${user.name ?? "the applicant"}
Applied for: ${app.role} at ${app.company}
Days since last update: ${daysSince} days
${app.notes ? `Notes: ${app.notes}` : ""}

Write a brief follow-up email (2 short paragraphs max) that:
- References the specific role applied for
- Is polite and not pushy
- Expresses continued interest
- Asks for a status update

Return ONLY valid JSON:
{
  "subject": "...",
  "body": "..."
}`

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
  const content = responseBody.output?.message?.content?.[0]?.text ?? ""

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: "AI response parsing failed" }, { status: 500 })

  const draft = JSON.parse(jsonMatch[0])

  // Save to follow_ups table
  const dueAt = new Date()
  await db.insert(followUps).values({
    applicationId: id,
    dueAt,
    subject: draft.subject,
    body: draft.body,
  })

  return NextResponse.json(draft)
}
