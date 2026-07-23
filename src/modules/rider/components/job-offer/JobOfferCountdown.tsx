"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface JobOfferCountdownProps {
  seconds: number;
  onExpire: () => void;
}

/**
 * Circular countdown timer shown on the job offer card — matches the
 * Figma orange "4:59" countdown circle. Calls onExpire when it hits 0.
 */
export function JobOfferCountdown({ seconds: initialSeconds, onExpire }: JobOfferCountdownProps) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const t = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = remaining / initialSeconds;

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="var(--border-default)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke={remaining <= 10 ? "var(--status-danger)" : "var(--brand-blue)"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000"
        />
      </svg>
      <span
        className={cn(
          "font-display font-bold text-[11px] tabular-nums",
          remaining <= 10 ? "text-status-danger" : "text-text-primary"
        )}
      >
        {mins}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}
