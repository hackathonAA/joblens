"use client"

import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <main className="min-h-svh bg-background flex items-center justify-center">
      {/* subtle grid bg */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-xs space-y-8 px-6">
        <div className="space-y-3 text-center">
          {/* Brand mark */}
          <div className="flex justify-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <rect width="36" height="36" rx="8" fill="oklch(0.65 0.20 15)" />
              <rect x="8" y="8" width="10" height="10" rx="2" fill="oklch(0.10 0.008 25)" />
              <rect x="22" y="18" width="6" height="10" rx="1.5" fill="oklch(0.10 0.008 25)" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">JobLens</h1>
          <p className="text-sm text-muted-foreground">
            The job search OS — track, analyze, and win.
          </p>
        </div>

        <button
          onClick={() => signIn("cognito", { callbackUrl: "/" })}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          Sign in with Cognito
        </button>
      </div>
    </main>
  )
}
