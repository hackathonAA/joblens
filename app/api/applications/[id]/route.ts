import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { applications, users } from "@/lib/schema"
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

  const allowed: Record<string, any> = { updatedAt: new Date() }
  if (body.status !== undefined) allowed.status = body.status
  if (body.company !== undefined) allowed.company = body.company
  if (body.role !== undefined) allowed.role = body.role
  if (body.notes !== undefined) allowed.notes = body.notes
  if (body.salaryMin !== undefined) allowed.salaryMin = body.salaryMin
  if (body.salaryMax !== undefined) allowed.salaryMax = body.salaryMax
  if (body.location !== undefined) allowed.location = body.location
  if (body.jobUrl !== undefined) allowed.jobUrl = body.jobUrl
  if (body.isArchived !== undefined) {
    allowed.isArchived = body.isArchived
    allowed.archivedAt = body.isArchived ? new Date() : null
  }

  const [row] = await db.update(applications)
    .set(allowed)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)))
    .returning()

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  await db.delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)))

  return NextResponse.json({ success: true })
}
