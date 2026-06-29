"use client"

import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <main className="min-h-svh bg-background flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="size-10 rounded-xl bg-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">JobLens</h1>
          <p className="text-sm text-muted-foreground">
            The job search OS — track, analyze, and win.
          </p>
        </div>
        <button
          onClick={() => signIn("cognito", { callbackUrl: "/" })}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign in with Cognito
        </button>
      </div>
    </main>
  )
}
