import { db } from "@/lib/db"
import { kanbanColumns } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { DEFAULT_COLUMNS, type DynamicColumn } from "@/lib/column-presets"

export type { DynamicColumn } from "@/lib/column-presets"
export { DEFAULT_COLUMNS, SALES_COLUMNS, FINANCE_COLUMNS, PRESETS } from "@/lib/column-presets"

export async function seedDefaultColumnsForUser(userId: string): Promise<DynamicColumn[]> {
  const values = DEFAULT_COLUMNS.map(col => ({ userId, ...col }))
  await db.insert(kanbanColumns).values(values).onConflictDoNothing()
  return db.select().from(kanbanColumns)
    .where(eq(kanbanColumns.userId, userId))
    .orderBy(kanbanColumns.position) as Promise<DynamicColumn[]>
}

export async function getUserColumns(userId: string): Promise<DynamicColumn[]> {
  const cols = await db.select().from(kanbanColumns)
    .where(eq(kanbanColumns.userId, userId))
    .orderBy(kanbanColumns.position) as DynamicColumn[]
  if (cols.length === 0) return seedDefaultColumnsForUser(userId)
  return cols
}
