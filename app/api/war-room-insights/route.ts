import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"

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

  const { offers, currency = "₹", currencyCode = "INR" } = await req.json()
  if (!offers?.length) return NextResponse.json({ error: "No offers provided" }, { status: 400 })

  const offerSummaries = offers.map((o: any) => `
Company: ${o.company}
Role: ${o.role}
Base Salary: ${currency}${o.baseSalary?.toLocaleString() ?? "unknown"} ${currencyCode}
Total Equity (4yr value): ${currency}${o.equityValue?.toLocaleString() ?? "unknown"} ${currencyCode}
Signing Bonus: ${currency}${o.signingBonus?.toLocaleString() ?? "unknown"} ${currencyCode}
Vesting: ${o.vesting ?? "unknown"}
Cliff: ${o.cliff ?? "unknown"}
4-Year Total Comp: ${currency}${Math.round((o.baseSalary ?? 0) + (o.equityValue ?? 0) / 4 + (o.signingBonus ?? 0) / 4).toLocaleString()} ${currencyCode}/yr
`.trim()).join("\n\n---\n\n")

  const prompt = `You are a compensation expert and career advisor helping a job seeker compare ${offers.length} job offer${offers.length > 1 ? "s" : ""}.

IMPORTANT: All amounts are in ${currencyCode} (${currency}). Use the ${currency} symbol and ${currencyCode} currency in your response — do NOT use $ or USD.

Here are the offers:

${offerSummaries}

Provide a JSON response with two keys:

"recommendation": A 2-3 sentence plain-English recommendation on which offer to take and why, considering total compensation, equity risk, vesting terms, and career trajectory. Be specific with numbers using ${currency} symbol. If only one offer, assess whether it's worth accepting or negotiating.

"negotiationTips": An array of 2-4 specific, actionable negotiation tips as strings. Each tip should be concrete (mention specific ${currencyCode} amounts or percentages). Focus on the biggest levers: base salary gaps, signing bonus as bridge compensation, equity refresh grants, and any red flags in the terms. Always use ${currency} symbol, never $.

Return ONLY valid JSON, no markdown.`

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
  const body = JSON.parse(new TextDecoder().decode(response.body))
  const content = body.output?.message?.content?.[0]?.text ?? ""

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
  }
}
