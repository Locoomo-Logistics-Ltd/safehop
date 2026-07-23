"use client";

import { cn } from "@/lib/utils";

interface OtpInputBoxesProps {
  length: number;
  value: string;
  hasError?: boolean;
}

/** Six individual boxes showing OTP entry progress, matching the Figma "4 9 2 _ _ _" display. */
export function OtpInputBoxes({ length, value, hasError }: OtpInputBoxesProps) {
  return (
    <div className="flex items-center justify-center gap-2.5" role="presentation">
      {Array.from({ length }).map((_, i) => {
        const digit = value[i];
        const isActive = i === value.length;
        return (
          <div
            key={i}
            className={cn(
              "w-10 h-12 rounded-[10px] border-2 flex items-center justify-center font-display font-bold text-[18px] text-text-primary transition-colors duration-150",
              hasError
                ? "border-status-danger bg-status-danger-bg"
                : isActive
                  ? "border-brand-blue bg-status-info-bg"
                  : digit
                    ? "border-border-strong bg-bg-card"
                    : "border-border-default bg-bg-card"
            )}
          >
            {digit ?? ""}
          </div>
        );
      })}
    </div>
  );
}
