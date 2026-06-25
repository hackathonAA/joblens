import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { users, interviewRounds } from "@/lib/schema"
import { eq } from "drizzle-orm"

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
  if (body.outcome !== undefined) allowed.outcome = body.outcome
  if (body.notes !== undefined) allowed.notes = body.notes
  if (body.interviewerName !== undefined) allowed.interviewerName = body.interviewerName
  if (body.interviewerTitle !== undefined) allowed.interviewerTitle = body.interviewerTitle
  if (body.roundType !== undefined) allowed.roundType = body.roundType
  if (body.scheduledAt !== undefined) allowed.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null

  const [round] = await db.update(interviewRounds).set(allowed).where(eq(interviewRounds.id, id)).returning()
  if (!round) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(round)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(interviewRounds).where(eq(interviewRounds.id, id))
  return NextResponse.json({ success: true })
}
