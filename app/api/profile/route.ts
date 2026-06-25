import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

async function getUser(session: any) {
  if (!session?.user?.id) return null
  const [user] = await db.select().from(users).where(eq(users.cognitoSub, session.user.id))
  return user ?? null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = await getUser(session)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const allowed: Record<string, any> = { updatedAt: new Date() }

  const fields = ["name", "username", "headline", "location", "bio", "linkedinUrl", "githubUrl", "targetRole", "targetSalaryMin", "targetSalaryMax"]
  for (const f of fields) {
    if (body[f] !== undefined) allowed[f] = body[f] === "" ? null : body[f]
  }

  // Validate username uniqueness if changing it
  if (body.username && body.username !== user.username) {
    const [existing] = await db.select().from(users).where(eq(users.username, body.username))
    if (existing && existing.id !== user.id)
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
  }

  const [updated] = await db.update(users).set(allowed).where(eq(users.id, user.id)).returning()
  return NextResponse.json(updated)
}
