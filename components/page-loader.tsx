"use client"

import { cn } from "@/lib/utils"

export function PageLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 w-full h-full min-h-[60vh]", className)}>
      <div className="flex items-end gap-px">
        {[3, 5, 8, 11, 8, 5, 3].map((h, i) => (
          <span
            key={i}
            className="block w-[3px] bg-primary animate-loader-bar"
            style={{
              height: `${h * 2}px`,
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
      </div>
      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">
        LOADING...
      </p>
      <style>{`
        @keyframes loader-bar {
          0%, 100% { opacity: 0.15; transform: scaleY(0.4); }
          50% { opacity: 1; transform: scaleY(1); }
        }
        .animate-loader-bar {
          animation: loader-bar 800ms ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
    </div>
  )
}
