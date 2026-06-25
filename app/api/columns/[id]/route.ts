import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { kanbanColumns, applications, users } from "@/lib/schema"
import { eq, and, ne } from "drizzle-orm"

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
  if (body.title !== undefined) allowed.title = body.title
  if (body.isDefault !== undefined) allowed.isDefault = body.isDefault
  if (body.isRejected !== undefined) allowed.isRejected = body.isRejected
  if (body.isInterviewEligible !== undefined) allowed.isInterviewEligible = body.isInterviewEligible
  if (body.isOfferStage !== undefined) allowed.isOfferStage = body.isOfferStage

  // If setting isDefault=true, clear it from all other columns first
  if (body.isDefault === true) {
    await db.update(kanbanColumns)
      .set({ isDefault: false })
      .where(and(eq(kanbanColumns.userId, user.id), ne(kanbanColumns.id, id)))
  }

  // If position changed, reorder surrounding columns
  if (body.position !== undefined) {
    const allCols = await db.select().from(kanbanColumns).where(eq(kanbanColumns.userId, user.id))
    const sorted = allCols.filter(c => c.id !== id).sort((a, b) => a.position - b.position)
    const newPos = Math.max(0, Math.min(body.position, sorted.length))
    sorted.splice(newPos, 0, { id } as any)
    await Promise.all(sorted.map((c, i) =>
      db.update(kanbanColumns).set({ position: i }).where(eq(kanbanColumns.id, c.id))
    ))
    allowed.position = newPos
  }

  const [col] = await db.update(kanbanColumns)
    .set(allowed)
    .where(and(eq(kanbanColumns.id, id), eq(kanbanColumns.userId, user.id)))
    .returning()

  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(col)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const url = new URL(req.url)
  const force = url.searchParams.get("force") === "true"

  const [col] = await db.select().from(kanbanColumns)
    .where(and(eq(kanbanColumns.id, id), eq(kanbanColumns.userId, user.id)))
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Prevent deleting the last column
  const allCols = await db.select().from(kanbanColumns).where(eq(kanbanColumns.userId, user.id))
  if (allCols.length <= 1) return NextResponse.json({ error: "Cannot delete the last column" }, { status: 400 })

  // Check for applications using this column
  const affected = await db.select().from(applications)
    .where(and(eq(applications.userId, user.id), eq(applications.status, col.columnKey)))
  if (affected.length > 0 && !force) {
    return NextResponse.json({ error: `${affected.length} applications in this column`, count: affected.length }, { status: 409 })
  }

  if (affected.length > 0 && force) {
    const defaultCol = allCols.find(c => c.isDefault && c.id !== id) ?? allCols.find(c => c.id !== id)!
    await db.update(applications)
      .set({ status: defaultCol.columnKey })
      .where(and(eq(applications.userId, user.id), eq(applications.status, col.columnKey)))
  }

  await db.delete(kanbanColumns).where(eq(kanbanColumns.id, id))
  return NextResponse.json({ success: true })
}
