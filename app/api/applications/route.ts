import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { applications, users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getUserColumns } from "@/lib/column-defaults"

async function getUser(session: any) {
  if (!session?.user?.id) return null
  const [user] = await db.select().from(users).where(eq(users.cognitoSub, session.user.id))
  return user ?? null
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let rows = await db.select().from(applications).where(eq(applications.userId, user.id))

  const excludeRejected = req.nextUrl.searchParams.get("excludeRejected") === "true"
  if (excludeRejected) {
    const cols = await getUserColumns(user.id)
    const rejectedKeys = new Set(cols.filter(c => c.isRejected).map(c => c.columnKey))
    rows = rows.filter(r => !rejectedKeys.has(r.status ?? ""))
  }

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // Default to user's default column if no status provided
  let defaultStatus = "applied"
  if (!body.status) {
    const cols = await getUserColumns(user.id)
    defaultStatus = cols.find(c => c.isDefault)?.columnKey ?? cols[0]?.columnKey ?? "applied"
  }

  const [row] = await db.insert(applications).values({
    userId: user.id,
    company: body.company,
    role: body.role,
    level: body.level,
    location: body.location,
    salaryMin: body.salaryMin,
    salaryMax: body.salaryMax,
    status: body.status ?? defaultStatus,
    jobUrl: body.jobUrl,
    notes: body.notes,
  }).returning()

  return NextResponse.json(row, { status: 201 })
}
