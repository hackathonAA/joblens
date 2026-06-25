import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { extractText } from "unpdf"

function cleanPdfText(raw: string): string {
  return raw
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove null bytes and control chars (except newlines/tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Collapse 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, "\n\n")
    // Remove lines that are just whitespace/numbers (page numbers etc)
    .split("\n")
    .filter(line => line.trim() && !/^\s*\d+\s*$/.test(line))
    .join("\n")
    // Collapse excessive spaces
    .replace(/[ \t]{3,}/g, "  ")
    // Fix hyphenated line breaks (word-\nbreak → wordbreak)
    .replace(/(\w)-\n(\w)/g, "$1$2")
    .trim()
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const buffer = new Uint8Array(await file.arrayBuffer())
  const { text } = await extractText(buffer, { mergePages: true })

  if (!text?.trim()) return NextResponse.json({ error: "No text found in PDF" }, { status: 400 })

  return NextResponse.json({ text: cleanPdfText(text) })
}
