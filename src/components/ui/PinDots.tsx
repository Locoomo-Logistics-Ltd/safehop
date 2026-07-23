import { cn } from "@/lib/utils";

interface PinDotsProps {
  length: number;
  filledCount: number;
  className?: string;
}

/** Row of dots showing PIN entry progress — filled vs. empty, matching Figma. */
export function PinDots({ length, filledCount, className }: PinDotsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)} role="presentation">
      {Array.from({ length }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-3.5 h-3.5 rounded-full border-2 transition-colors duration-150",
            i < filledCount ? "bg-brand-navy border-brand-navy" : "bg-transparent border-border-strong"
          )}
        />
      ))}
    </div>
  );
}
