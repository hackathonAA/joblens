"use client"

import { useState } from "react"
import { X, Copy, CheckCircle, Loader2, RotateCcw, Mail, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

type OutreachResult = {
  email: { subject: string; body: string }
  dm: string
}

type Tab = "email" | "dm"

export function OutreachModal({
  applicationId,
  company,
  role,
  onClose,
}: {
  applicationId: string
  company: string
  role: string
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>("email")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OutreachResult | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    setCopied(false)
    try {
      const res = await fetch(`/api/applications/${applicationId}/outreach`, { method: "POST" })
      if (!res.ok) throw new Error()
      setResult(await res.json())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate on first open
  useState(() => { generate() })

  function copyText() {
    if (!result) return
    const text = tab === "email"
      ? `Subject: ${result.email.subject}\n\n${result.email.body}`
      : result.dm
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-card-foreground">Cold Outreach</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{company} — {role}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background/60 p-1">
            <button onClick={() => setTab("email")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === "email" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              <Mail className="size-3.5" /> Cold Email
            </button>
            <button onClick={() => setTab("dm")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === "dm" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              <MessageSquare className="size-3.5" /> LinkedIn DM
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={generate} disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
              Regenerate
            </button>
            <button onClick={copyText} disabled={!result || loading}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {copied ? <CheckCircle className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Amazon Nova is drafting your message…</p>
            </div>
          )}

          {!loading && result && tab === "email" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Subject</p>
                <p className="text-sm font-medium text-card-foreground">{result.email.subject}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Body</p>
                <p className="text-[13px] text-card-foreground leading-relaxed whitespace-pre-wrap">{result.email.body}</p>
              </div>
            </div>
          )}

          {!loading && result && tab === "dm" && (
            <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">LinkedIn DM</p>
              <p className="text-[13px] text-card-foreground leading-relaxed whitespace-pre-wrap">{result.dm}</p>
            </div>
          )}

          {!loading && !result && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">Failed to generate. Try again.</p>
              <button onClick={generate} className="mt-3 text-xs text-primary hover:opacity-80">Retry</button>
            </div>
          )}
        </div>

        <div className="px-5 pb-4 pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground">Powered by Amazon Nova · Review before sending</p>
        </div>
      </div>
    </div>
  )
}
