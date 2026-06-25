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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const allowed: Record<string, any> = {}
  if (body.baseSalary !== undefined) allowed.baseSalary = body.baseSalary
  if (body.equityValue !== undefined) allowed.equityValue = body.equityValue
  if (body.vestingSchedule !== undefined) allowed.vestingSchedule = body.vestingSchedule
  if (body.cliffMonths !== undefined) allowed.cliffMonths = body.cliffMonths
  if (body.signingBonus !== undefined) allowed.signingBonus = body.signingBonus

  const [offer] = await db.update(offerLetters).set(allowed).where(eq(offerLetters.id, id)).returning()
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const apps = await db.select().from(applications).where(eq(applications.userId, user.id))
  const app = apps.find(a => a.id === offer.applicationId)

  return NextResponse.json({ ...offer, company: app?.company ?? "", role: app?.role ?? "" })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(offerLetters).where(eq(offerLetters.id, id))
  return NextResponse.json({ success: true })
}
