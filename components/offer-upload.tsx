"use client"

import { useRef, useState } from "react"
import { FileText, Upload, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function OfferUpload({
  onLoadSample,
  onFileText,
}: {
  onLoadSample: () => void
  onFileText?: (text: string) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [reading, setReading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file) return
    setReading(true)
    try {
      if (file.type === "application/pdf") {
        // For PDF: read as ArrayBuffer and extract text via a simple approach
        // We'll send it to an API route that extracts text, or just read as text
        const text = await file.text().catch(() => "")
        if (text.trim() && onFileText) {
          onFileText(text)
        } else {
          // PDF binary — can't read directly, fall back to sample
          onLoadSample()
        }
      } else {
        const text = await file.text()
        if (text.trim() && onFileText) {
          onFileText(text)
        }
      }
    } finally {
      setReading(false)
    }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={async e => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) await handleFile(file)
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/50 px-6 py-10 text-center transition-colors",
        dragging && "border-primary bg-primary/5",
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        {reading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
      </div>
      <div>
        <p className="text-sm font-medium text-card-foreground">
          Drag &amp; drop your offer letter
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          .txt files work best — or paste the text below
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
        >
          <FileText className="size-3.5" />
          Browse files
        </button>
        <button
          type="button"
          onClick={onLoadSample}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Try sample offer
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.doc,.docx"
        className="hidden"
        onChange={async e => {
          const file = e.target.files?.[0]
          if (file) await handleFile(file)
        }}
      />
    </div>
  )
}
