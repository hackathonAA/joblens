import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { applications, users } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { getUserColumns } from "@/lib/column-defaults"

export const dynamic = "force-dynamic"

async function getUser(session: any) {
  if (!session?.user?.id) return null
  const [user] = await db.select().from(users).where(eq(users.cognitoSub, session.user.id))
  return user ?? null
}

// GET /api/applications/archive — returns all archived applications
export async function GET() {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const archived = await db.select().from(applications)
    .where(and(eq(applications.userId, user.id), eq(applications.isArchived, true)))

  return NextResponse.json(archived)
}

// POST /api/applications/archive — auto-archives rejected apps older than 15 days, returns count
export async function POST() {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const cols = await getUserColumns(user.id)
  const rejectedKeys = new Set(cols.filter(c => c.isRejected).map(c => c.columnKey))

  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)

  const all = await db.select().from(applications)
    .where(and(eq(applications.userId, user.id), eq(applications.isArchived, false)))

  const toArchive = all.filter(a =>
    rejectedKeys.has(a.status ?? "") &&
    new Date(a.updatedAt ?? a.appliedAt ?? 0) < fifteenDaysAgo
  )

  if (toArchive.length === 0) return NextResponse.json({ archived: 0 })

  await Promise.all(toArchive.map(a =>
    db.update(applications)
      .set({ isArchived: true, archivedAt: new Date() })
      .where(eq(applications.id, a.id))
  ))

  return NextResponse.json({ archived: toArchive.length })
}
