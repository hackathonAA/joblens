import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { users, applications } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getUserColumns } from "@/lib/column-defaults"

export const dynamic = "force-dynamic"

async function getUser(session: any) {
  if (!session?.user?.id) return null
  const [user] = await db.select().from(users).where(eq(users.cognitoSub, session.user.id))
  return user ?? null
}

// Returns applications not updated in 7+ days, excluding rejected/offer stage
export async function GET() {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const cols = await getUserColumns(user.id)
  const excludeKeys = new Set([
    ...cols.filter(c => c.isRejected).map(c => c.columnKey),
    ...cols.filter(c => c.isOfferStage).map(c => c.columnKey),
  ])

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const apps = await db.select().from(applications).where(eq(applications.userId, user.id))

  const stale = apps
    .filter(a => {
      if (excludeKeys.has(a.status ?? "")) return false
      const lastUpdate = new Date(a.updatedAt ?? a.appliedAt ?? 0)
      return lastUpdate < sevenDaysAgo
    })
    .sort((a, b) => new Date(a.updatedAt ?? a.appliedAt ?? 0).getTime() - new Date(b.updatedAt ?? b.appliedAt ?? 0).getTime())
    .slice(0, 8)
    .map(a => ({
      id: a.id,
      company: a.company,
      role: a.role,
      status: a.status,
      daysSince: Math.floor((Date.now() - new Date(a.updatedAt ?? a.appliedAt ?? 0).getTime()) / 86400000),
      lastUpdate: a.updatedAt ?? a.appliedAt,
    }))

  return NextResponse.json(stale)
}
