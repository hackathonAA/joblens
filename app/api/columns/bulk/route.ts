import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { kanbanColumns, applications, users } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import type { DynamicColumn } from "@/lib/column-defaults"

async function getUser(session: any) {
  if (!session?.user?.id) return null
  const [user] = await db.select().from(users).where(eq(users.cognitoSub, session.user.id))
  return user ?? null
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { columns }: { columns: (Partial<DynamicColumn> & { columnKey: string; title: string; position: number })[] } = await req.json()
  if (!Array.isArray(columns) || columns.length === 0)
    return NextResponse.json({ error: "Columns array required" }, { status: 400 })

  const existing = await db.select().from(kanbanColumns).where(eq(kanbanColumns.userId, user.id))
  const existingKeys = new Set(existing.map(c => c.columnKey))
  const incomingKeys = new Set(columns.map(c => c.columnKey))

  // Move applications from deleted columns to the incoming default
  const defaultCol = columns.find(c => c.isDefault) ?? columns[0]
  const deletedKeys = [...existingKeys].filter(k => !incomingKeys.has(k))
  for (const key of deletedKeys) {
    await db.update(applications)
      .set({ status: defaultCol.columnKey })
      .where(and(eq(applications.userId, user.id), eq(applications.status, key)))
  }

  // Delete removed columns
  for (const key of deletedKeys) {
    const col = existing.find(c => c.columnKey === key)
    if (col) await db.delete(kanbanColumns).where(eq(kanbanColumns.id, col.id))
  }

  // Upsert all incoming columns
  const saved = await Promise.all(columns.map(async (col, i) => {
    const existingCol = existing.find(c => c.columnKey === col.columnKey)
    if (existingCol) {
      const [updated] = await db.update(kanbanColumns).set({
        title: col.title,
        position: col.position ?? i,
        isDefault: col.isDefault ?? false,
        isRejected: col.isRejected ?? false,
        isInterviewEligible: col.isInterviewEligible ?? false,
        isOfferStage: col.isOfferStage ?? false,
      }).where(eq(kanbanColumns.id, existingCol.id)).returning()
      return updated
    } else {
      const [created] = await db.insert(kanbanColumns).values({
        userId: user.id,
        columnKey: col.columnKey,
        title: col.title,
        position: col.position ?? i,
        isDefault: col.isDefault ?? false,
        isRejected: col.isRejected ?? false,
        isInterviewEligible: col.isInterviewEligible ?? false,
        isOfferStage: col.isOfferStage ?? false,
      }).returning()
      return created
    }
  }))

  return NextResponse.json(saved.sort((a, b) => a.position - b.position))
}
