"use client"

import { PencilLine } from "lucide-react"
import {
  type InterviewRound,
  type Outcome,
  OUTCOME_CONFIG,
  topicClass,
} from "@/lib/interview-data"
import { StarRating } from "@/components/star-rating"
import { cn } from "@/lib/utils"

const OUTCOMES: Outcome[] = ["passed", "pending", "failed"]

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function RoundDetail({
  round,
  onRatingChange,
  onOutcomeChange,
  onShouldHaveSaidChange,
}: {
  round: InterviewRound
  onRatingChange: (value: number) => void
  onOutcomeChange: (outcome: Outcome) => void
  onShouldHaveSaidChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-card-foreground">
            {round.type}
          </h2>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              OUTCOME_CONFIG[round.outcome].badge,
            )}
          >
            {OUTCOME_CONFIG[round.outcome].label}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatLongDate(round.date)} · {round.interviewer} —{" "}
          {round.interviewerTitle}
        </p>
      </div>

      {/* Questions */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Questions asked
        </h3>
        <ul className="flex flex-col gap-2">
          {round.questions.map((q) => (
            <li
              key={q.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/60 p-3"
            >
              <span className="text-[13px] leading-relaxed text-card-foreground">
                {q.prompt}
              </span>
              <span
                className={cn(
                  "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  topicClass(q.topic),
                )}
              >
                {q.topic}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Notes */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your notes on what you said
        </h3>
        <p className="rounded-lg border border-border bg-background/60 p-3 text-[13px] leading-relaxed text-card-foreground">
          {round.notes}
        </p>
      </section>

      {/* What you should have said (editable) */}
      <section>
        <label
          htmlFor="should-have-said"
          className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          <PencilLine className="size-3.5" />
          What you should have said
        </label>
        <textarea
          id="should-have-said"
          value={round.shouldHaveSaid}
          onChange={(e) => onShouldHaveSaidChange(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-border bg-background/60 p-3 text-[13px] leading-relaxed text-card-foreground outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
        />
      </section>

      {/* Rating + Outcome */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Overall rating
          </span>
          <StarRating value={round.rating} onChange={onRatingChange} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Outcome
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background/60 p-1">
            {OUTCOMES.map((o) => {
              const active = o === round.outcome
              const cfg = OUTCOME_CONFIG[o]
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => onOutcomeChange(o)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? cfg.badge
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
