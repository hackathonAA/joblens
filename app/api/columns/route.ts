import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { kanbanColumns, users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getUserColumns, seedDefaultColumnsForUser } from "@/lib/column-defaults"

async function getUser(session: any) {
  if (!session?.user?.id) return null
  const [user] = await db.select().from(users).where(eq(users.cognitoSub, session.user.id))
  return user ?? null
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "")
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const cols = await getUserColumns(user.id)
  return NextResponse.json(cols)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const columnKey = body.columnKey ?? slugify(body.title)

  const existing = await db.select().from(kanbanColumns)
    .where(eq(kanbanColumns.userId, user.id))
  if (existing.some(c => c.columnKey === columnKey))
    return NextResponse.json({ error: "Column key already exists" }, { status: 409 })

  const position = body.position ?? existing.length

  const [col] = await db.insert(kanbanColumns).values({
    userId: user.id,
    columnKey,
    title: body.title,
    position,
    isDefault: body.isDefault ?? false,
    isRejected: body.isRejected ?? false,
    isInterviewEligible: body.isInterviewEligible ?? false,
    isOfferStage: body.isOfferStage ?? false,
  }).returning()

  return NextResponse.json(col, { status: 201 })
}
