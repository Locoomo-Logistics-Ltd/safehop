import { cn } from "@/lib/utils";

interface ProgressStepsProps {
  total: number;
  current: number; // 1-indexed
  className?: string;
}

/** Thin segmented progress bar shown under the top app bar during multi-step flows. */
export function ProgressSteps({ total, current, className }: ProgressStepsProps) {
  return (
    <div className={cn("flex gap-1.5", className)} role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors duration-300",
            i < current ? "bg-brand-blue" : "bg-border-default"
          )}
        />
      ))}
    </div>
  );
}
