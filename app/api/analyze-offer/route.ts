import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"
import { db } from "@/lib/db"
import { users, applications, offerLetters } from "@/lib/schema"
import { eq } from "drizzle-orm"

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: "No text provided" }, { status: 400 })

  const prompt = `You are an employment lawyer reviewing a job offer letter. Analyze the following offer letter.

Return a single JSON object with two keys:

"meta": an object with:
- company: company name (string or null)
- role: job title (string or null)
- baseSalary: annual base salary in dollars as integer (null if not found)
- signingBonus: signing bonus in dollars as integer (null if not found)
- equityValue: total equity value in dollars as integer (null if not found)
- vestingSchedule: vesting schedule as string (null if not found)
- startDate: start date as YYYY-MM-DD string (null if not found)

"clauses": an array of clause objects, each with:
- id: short kebab-case identifier
- name: human-readable clause name
- risk: "green" (standard/acceptable), "yellow" (negotiate), or "red" (flag before signing)
- explanation: plain English explanation (2-3 sentences)
- redline: specific negotiation advice (2-3 sentences)
- excerpt: exact verbatim substring from the offer text (must exist in the text)

Focus clauses on: compensation, equity/vesting, non-compete, IP assignment, arbitration, clawback, at-will, termination, benefits.

Return ONLY valid JSON, no markdown, no explanation outside the JSON.

Offer letter text:
${text}`

  const command = new InvokeModelCommand({
    modelId: "amazon.nova-pro-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 4096 },
    }),
  })

  const response = await bedrock.send(command)
  const body = JSON.parse(new TextDecoder().decode(response.body))
  const content = body.output?.message?.content?.[0]?.text ?? ""

  // Try to parse as { meta, clauses } first, fall back to plain array
  let meta: any = {}
  let clauses: any[] = []

  try {
    const objMatch = content.match(/\{[\s\S]*\}/)
    if (objMatch) {
      const parsed = JSON.parse(objMatch[0])
      if (parsed.clauses) {
        clauses = parsed.clauses
        meta = parsed.meta ?? {}
      } else if (Array.isArray(parsed)) {
        clauses = parsed
      }
    } else {
      const arrMatch = content.match(/\[[\s\S]*\]/)
      if (arrMatch) clauses = JSON.parse(arrMatch[0])
    }
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
  }

  if (!clauses.length) return NextResponse.json({ error: "No clauses found" }, { status: 500 })

  // Cross-check against user's kanban applications and war room offers
  const [user] = await db.select().from(users).where(eq(users.cognitoSub, session.user.id as string))
  let matchedApp: any = null
  let existingOffer: any = null
  let suggestions: { type: "add-to-tracker" | "add-to-war-room" | "update-offer"; message: string; data?: any }[] = []

  if (user && meta.company) {
    const userApps = await db.select().from(applications).where(eq(applications.userId, user.id))
    const companyLower = meta.company.toLowerCase()

    // Check if company exists in kanban
    matchedApp = userApps.find(a => a.company.toLowerCase().includes(companyLower) || companyLower.includes(a.company.toLowerCase()))

    if (!matchedApp) {
      suggestions.push({
        type: "add-to-tracker",
        message: `"${meta.company}" isn't in your tracker yet. Add it to keep track of this application?`,
        data: {
          company: meta.company,
          role: meta.role ?? "",
          status: "offer",
          salaryMin: meta.baseSalary ? Math.round(meta.baseSalary / 1000) : undefined,
          salaryMax: meta.baseSalary ? Math.round(meta.baseSalary / 1000) : undefined,
        }
      })
    } else {
      // Company is in tracker — check if they have a war room offer
      const allOffers = await db.select().from(offerLetters).where(eq(offerLetters.applicationId, matchedApp.id))
      existingOffer = allOffers[0] ?? null

      // Check for missing fields we can fill in

      if (!existingOffer) {
        const filledFields = [
          meta.baseSalary && "base salary",
          meta.equityValue && "equity",
          meta.signingBonus && "signing bonus",
          meta.vestingSchedule && "vesting schedule",
        ].filter(Boolean).join(", ")

        suggestions.push({
          type: "add-to-war-room",
          message: `${meta.company} is in your tracker. Add this offer to War Room${filledFields ? ` with ${filledFields} pre-filled` : ""}?`,
          data: {
            applicationId: matchedApp.id,
            baseSalary: meta.baseSalary,
            equityValue: meta.equityValue,
            signingBonus: meta.signingBonus,
            vestingSchedule: meta.vestingSchedule,
            startDate: meta.startDate,
          },
          appPatch: {
            role: !matchedApp.role ? meta.role : undefined,
            salaryMin: !matchedApp.salaryMin && meta.baseSalary ? Math.round(meta.baseSalary / 1000) : undefined,
            salaryMax: !matchedApp.salaryMax && meta.baseSalary ? Math.round(meta.baseSalary / 1000) : undefined,
          }
        })
      } else {
        // Offer exists — check if it's missing data we can update
        const updates: Record<string, any> = {}
        if (!existingOffer.baseSalary && meta.baseSalary) updates.baseSalary = meta.baseSalary
        if (!existingOffer.equityValue && meta.equityValue) updates.equityValue = meta.equityValue
        if (!existingOffer.signingBonus && meta.signingBonus) updates.signingBonus = meta.signingBonus
        if (!existingOffer.vestingSchedule && meta.vestingSchedule) updates.vestingSchedule = meta.vestingSchedule

        if (Object.keys(updates).length > 0) {
          suggestions.push({
            type: "update-offer",
            message: `We found missing details for your ${meta.company} offer in War Room. Update it with ${Object.keys(updates).join(", ")}?`,
            data: { offerId: existingOffer.id, updates }
          })
        }
      }
    }
  }

  return NextResponse.json({ clauses, meta, suggestions })
}
