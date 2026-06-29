"use client"

import { signIn } from "next-auth/react"
import { Telescope, Sparkles, BarChart3, Target } from "lucide-react"

const FEATURES = [
  { icon: Target,     text: "Kanban tracker across every pipeline stage" },
  { icon: BarChart3,  text: "AI-powered offer analysis & salary insights" },
  { icon: Sparkles,   text: "JD fit scoring, cold outreach & interview prep" },
]

export default function LoginPage() {
  return (
    <main className="min-h-svh bg-background flex">
      {/* Left: brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-card border-r border-border relative overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_20px_oklch(0.64_0.22_262/40%)]">
              <Telescope className="size-5 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Job<span className="text-primary">Lens</span>
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight text-foreground mb-4">
            Your job search,<br />
            <span className="text-primary">intelligently tracked.</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
            From first application to final offer — JobLens gives you clarity,
            AI-powered insights, and the edge you need to land the role.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
                  <Icon className="size-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground/50">
          Built for ambitious job seekers. Powered by AWS Bedrock AI.
        </p>
      </div>

      {/* Right: login */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-[0_0_16px_oklch(0.64_0.22_262/40%)]">
              <Telescope className="size-4.5 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Job<span className="text-primary">Lens</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-8">Sign in to continue to your dashboard.</p>

          <button
            onClick={() => signIn("cognito", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_oklch(0.64_0.22_262/30%)] transition-all hover:opacity-90 hover:shadow-[0_0_28px_oklch(0.64_0.22_262/50%)] active:scale-[0.98]"
          >
            <Telescope className="size-4" strokeWidth={2} />
            Sign in with Cognito
          </button>

          <p className="mt-6 text-center text-xs text-muted-foreground/60">
            Secure authentication via AWS Cognito
          </p>
        </div>
      </div>
    </main>
  )
}
