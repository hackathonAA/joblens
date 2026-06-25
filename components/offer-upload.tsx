"use client"

import { useRef, useState } from "react"
import { FileText, Upload, Loader2, CheckCircle, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

type UploadState = "idle" | "reading" | "extracting" | "done" | "error"

export function OfferUpload({
  onLoadSample,
  onFileText,
}: {
  onLoadSample: () => void
  onFileText?: (text: string) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function handleFile(file: File) {
    if (!file) return
    setFileName(file.name)
    setFileSize(formatSize(file.size))
    setErrorMsg("")

    try {
      if (file.type === "application/pdf") {
        setUploadState("extracting")
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/extract-pdf", { method: "POST", body: formData })
        if (!res.ok) throw new Error("PDF extraction failed")
        const { text } = await res.json()
        if (!text?.trim()) throw new Error("No readable text found in this PDF")
        setUploadState("done")
        setTimeout(() => { if (onFileText) onFileText(text) }, 800)
      } else {
        setUploadState("reading")
        const text = await file.text()
        if (!text.trim()) throw new Error("File appears to be empty")
        setUploadState("done")
        setTimeout(() => { if (onFileText) onFileText(text) }, 800)
      }
    } catch (e: any) {
      setUploadState("error")
      setErrorMsg(e.message ?? "Failed to read file")
    }
  }

  function reset() {
    setUploadState("idle")
    setFileName("")
    setFileSize("")
    setErrorMsg("")
  }

  const STATE_LABELS: Record<UploadState, string> = {
    idle: "Drag & drop your offer letter",
    reading: "Reading file…",
    extracting: "Extracting text from PDF…",
    done: "File ready — starting analysis…",
    error: "Upload failed",
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
        "rounded-xl border-2 border-dashed border-border bg-card/50 transition-colors",
        dragging && "border-primary bg-primary/5",
        uploadState === "done" && "border-emerald-500/50 bg-emerald-500/5",
        uploadState === "error" && "border-red-500/50 bg-red-500/5",
      )}
    >
      {uploadState === "idle" ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Upload className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">Drag & drop your offer letter</p>
            <p className="mt-0.5 text-xs text-muted-foreground">PDF and .txt supported — or paste below</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent">
              <FileText className="size-3.5" /> Browse files
            </button>
            <button type="button" onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Try sample offer
            </button>
          </div>
        </div>
      ) : uploadState === "reading" || uploadState === "extracting" ? (
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">{fileSize} · {STATE_LABELS[uploadState]}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className={cn(
                "h-full rounded-full bg-primary transition-all duration-500",
                uploadState === "reading" ? "w-1/3" : "w-2/3 animate-pulse"
              )} />
            </div>
          </div>
        </div>
      ) : uploadState === "done" ? (
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <CheckCircle className="size-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">{fileName}</p>
            <p className="text-xs text-emerald-400">{fileSize} · Successfully extracted — analyzing now…</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-full rounded-full bg-emerald-500 transition-all duration-300" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
            <AlertCircle className="size-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">{fileName}</p>
            <p className="text-xs text-red-400">{errorMsg}</p>
          </div>
          <button onClick={reset} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      )}

      <input ref={inputRef} type="file" accept=".pdf,.txt" className="hidden"
        onChange={async e => {
          const file = e.target.files?.[0]
          if (file) await handleFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
