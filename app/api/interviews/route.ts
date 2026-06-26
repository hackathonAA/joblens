import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { applications, users, interviewRounds, interviewQuestions } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { getUserColumns } from "@/lib/column-defaults"

export const dynamic = "force-dynamic"

async function getUser(session: any) {
  if (!session?.user?.id) return null
  const [user] = await db.select().from(users).where(eq(users.cognitoSub, session.user.id))
  return user ?? null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const cols = await getUserColumns(user.id)
  const interviewKeys = cols.filter(c => c.isInterviewEligible).map(c => c.columnKey)
  const rejectedKeys = new Set(cols.filter(c => c.isRejected).map(c => c.columnKey))

  const apps = await db.select().from(applications).where(eq(applications.userId, user.id))
  const activeApps = apps.filter(a => interviewKeys.includes(a.status ?? ""))
  const rejectedApps = apps.filter(a => rejectedKeys.has(a.status ?? ""))

  const allApps = await Promise.all(
    [...activeApps, ...rejectedApps].map(async (app) => {
      const rounds = await db.select().from(interviewRounds).where(eq(interviewRounds.applicationId, app.id))

      // Rejected with no rounds = went straight to rejected, skip entirely
      if (rejectedKeys.has(app.status ?? "") && rounds.length === 0) return null

      const roundsWithQuestions = await Promise.all(
        rounds.map(async (round) => {
          const questions = await db.select().from(interviewQuestions).where(eq(interviewQuestions.roundId, round.id))
          return { ...round, questions }
        })
      )
      return { ...app, rounds: roundsWithQuestions }
    })
  )

  return NextResponse.json(allApps.filter(Boolean))
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

  const [round] = await db.insert(interviewRounds).values({
    applicationId: body.applicationId,
    roundType: body.roundType,
    interviewerName: body.interviewerName,
    interviewerTitle: body.interviewerTitle,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    outcome: body.outcome ?? "pending",
    notes: body.notes ?? "",
  }).returning()

  return NextResponse.json({ ...round, questions: [] }, { status: 201 })
}
