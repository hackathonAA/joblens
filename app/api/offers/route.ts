import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { applications, users, offerLetters } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

async function getUser(session: any) {
  if (!session?.user?.id) return null
  const [user] = await db.select().from(users).where(eq(users.cognitoSub, session.user.id))
  return user ?? null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apps = await db.select().from(applications).where(eq(applications.userId, user.id))
  const appIds = apps.map(a => a.id)
  if (appIds.length === 0) return NextResponse.json([])

  const offers = await db.select().from(offerLetters)
  const userOffers = offers.filter(o => appIds.includes(o.applicationId))

  return NextResponse.json(userOffers.map(o => {
    const app = apps.find(a => a.id === o.applicationId)
    return { ...o, company: app?.company ?? "", role: app?.role ?? "" }
  }))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const [app] = await db.select().from(applications).where(
    and(eq(applications.id, body.applicationId), eq(applications.userId, user.id))
  )
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 })

  const [offer] = await db.insert(offerLetters).values({
    applicationId: body.applicationId,
    baseSalary: body.baseSalary,
    equityValue: body.equityValue,
    vestingSchedule: body.vestingSchedule,
    cliffMonths: body.cliffMonths,
    signingBonus: body.signingBonus,
    startDate: body.startDate,
  }).returning()

  return NextResponse.json({ ...offer, company: app.company, role: app.role }, { status: 201 })
}
