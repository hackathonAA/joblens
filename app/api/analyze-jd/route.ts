import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { users, applications, jdExtractions } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { jd, applicationId } = body

  if (!jd?.trim()) return NextResponse.json({ error: "jd is required" }, { status: 400 })

  // Verify application belongs to user if provided
  if (applicationId) {
    const [app] = await db.select().from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)))
    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  const userProfile = `Name: ${user.name ?? "Not set"}
Target Role: ${user.targetRole ?? "Not set"}
Headline: ${user.headline ?? "Not set"}
Bio: ${user.bio ?? "Not set"}
Location: ${user.location ?? "Not set"}
Target Salary Min: ${user.targetSalaryMin ? String(user.targetSalaryMin) : "Not set"}
Target Salary Max: ${user.targetSalaryMax ? String(user.targetSalaryMax) : "Not set"}`

  const prompt = `You are a technical recruiter and career coach. Analyze this job description and the candidate's profile.

JOB DESCRIPTION:
${jd.slice(0, 4000)}

CANDIDATE PROFILE:
${userProfile}

Extract the following and return ONLY valid JSON:

{
  "requiredSkills": ["skill1", "skill2"],
  "niceToHaveSkills": ["skill1", "skill2"],
  "senioritySignals": ["signal1", "signal2"],
  "redFlags": ["flag1", "flag2"],
  "salarySignals": "one sentence about salary info or 'Not mentioned'",
  "techStack": ["tech1", "tech2"],
  "fitScore": 75,
  "fitReason": "2-3 sentences: reference the candidate's headline, bio, target role, and salary expectations when assessing fit. Be specific about what matches and what gaps exist."
}

Rules:
- requiredSkills: hard requirements (must-have skills, years of experience)
- niceToHaveSkills: preferred/bonus skills
- senioritySignals: phrases indicating seniority level (e.g. "lead a team", "5+ years")
- redFlags: concerning phrases (e.g. "24/7 on-call", "wear many hats", "fast-paced startup", "unlimited PTO")
- fitScore: 0-100. Use the candidate's bio, headline, target role, and salary expectations to compute this. If profile is sparse, use 50 as default. Reduce score if salary signals are below the candidate's target.
- techStack: all technologies mentioned
- Return ONLY valid JSON, no markdown`

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

  const result = JSON.parse(jsonMatch[0])

  // Save to DB — use only columns that exist if migration hasn't been run
  let saved: any = { id: null }
  const baseValues = {
    ...(applicationId ? { applicationId } : {}),
    rawJd: jd.trim(),
    techStack: result.techStack ?? [],
    senioritySignals: result.senioritySignals ?? [],
    redFlags: result.redFlags ?? [],
    salarySignals: result.salarySignals ?? null,
  }
  try {
    const [row] = await db.insert(jdExtractions).values({
      ...baseValues,
      requiredSkills: result.requiredSkills ?? [],
      niceToHaveSkills: result.niceToHaveSkills ?? [],
      fitScore: result.fitScore ?? null,
      fitReason: result.fitReason ?? null,
    }).returning()
    saved = row
  } catch {
    // Fallback if new columns don't exist yet
    const [row] = await db.insert(jdExtractions).values(baseValues).returning()
    saved = row
  }

  return NextResponse.json({ ...result, id: saved.id }, { status: 201 })
}
