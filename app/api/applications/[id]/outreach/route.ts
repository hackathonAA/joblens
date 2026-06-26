import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { users, applications } from "@/lib/schema"
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

  const candidateName = user.name ?? "the candidate"
  const headline = user.headline ?? ""
  const targetRole = user.targetRole ?? app.role

  const prompt = `You are a professional career coach helping a job seeker write outreach messages.

Candidate: ${candidateName}
${headline ? `Current title/headline: ${headline}` : ""}
Target role: ${targetRole}
Applying to: ${app.role} at ${app.company}${app.level ? ` (${app.level})` : ""}${app.location ? ` — ${app.location}` : ""}

Write two outreach messages:
1. A cold email to a hiring manager or recruiter at ${app.company}
2. A LinkedIn DM (shorter, more casual)

Guidelines:
- Be specific to ${app.company} and the ${app.role} role
- Sound genuine, not templated — avoid "I hope this message finds you well"
- Email: 3 short paragraphs max, subject line included
- LinkedIn DM: 3-4 sentences max
- Mention a specific reason for interest in ${app.company}
- End with a clear, low-pressure ask

Return ONLY valid JSON:
{
  "email": {
    "subject": "...",
    "body": "..."
  },
  "dm": "..."
}`

  const command = new InvokeModelCommand({
    modelId: "amazon.nova-pro-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 1024 },
    }),
  })

  const response = await bedrock.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))
  const content = responseBody.output?.message?.content?.[0]?.text ?? ""

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: "AI response parsing failed" }, { status: 500 })

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
