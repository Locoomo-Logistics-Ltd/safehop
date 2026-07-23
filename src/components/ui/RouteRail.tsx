import { cn } from "@/lib/utils";

interface RouteRailProps {
  originLabel: string;
  destinationLabel: string;
  /** 0 to 1 — how far along the route the parcel currently is. */
  progress?: number;
  variant?: "compact" | "full";
  className?: string;
}

/**
 * The signature visual motif of the Locoomo app: a horizontal dotted
 * route line between two waypoint dots, optionally showing progress.
 * Used in delivery cards (compact) and the tracking screen (full).
 */
export function RouteRail({
  originLabel,
  destinationLabel,
  progress = 0,
  variant = "compact",
  className,
}: RouteRailProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Waypoint filled={clampedProgress > 0} size={variant} />

      <div className="relative flex-1 h-[2px] rounded-full bg-border-default overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-brand-blue rounded-full transition-all duration-500"
          style={{ width: `${clampedProgress * 100}%` }}
        />
        {/* Dotted texture overlay */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0, transparent 3px, var(--bg-canvas) 3px, var(--bg-canvas) 6px)",
          }}
          aria-hidden="true"
        />
      </div>

      <Waypoint filled={clampedProgress >= 1} active size={variant} />

      {variant === "full" && (
        <span className="sr-only">
          Route from {originLabel} to {destinationLabel}, {Math.round(clampedProgress * 100)}% complete
        </span>
      )}
    </div>
  );
}

function Waypoint({
  filled,
  active,
  size,
}: {
  filled: boolean;
  active?: boolean;
  size: "compact" | "full";
}) {
  const dimension = size === "full" ? "w-3 h-3" : "w-2 h-2";

  return (
    <span
      className={cn(
        "rounded-full shrink-0 border-2",
        dimension,
        filled
          ? active
            ? "bg-status-success border-status-success"
            : "bg-brand-blue border-brand-blue"
          : "bg-bg-card border-border-strong"
      )}
      aria-hidden="true"
    />
  );
}
