"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            className={cn(
              "size-5",
              n <= value
                ? "fill-[var(--chart-warn)] text-[var(--chart-warn)]"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  )
}
