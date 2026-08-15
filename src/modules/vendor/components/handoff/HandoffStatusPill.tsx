import { cn } from "@/lib/utils";
import { HANDOFF_STATUS } from "@/core/types";
import type { OrderStatus } from "@/core/types";

/**
 * Status pill for the handoff lifecycle.
 *
 * Deliberately not `@/components/ui/StatusBadge` — that one is keyed on
 * `DeliveryStatus`, a different (and older) enum that shares no members
 * with these. Widening it would mean merging two lifecycles that only
 * look alike, so the handoff module carries its own.
 *
 * Falls back to a neutral pill for anything unrecognized, since
 * `OrderStatus` is a bare `string` and the server may know statuses
 * this build doesn't.
 */

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  [HANDOFF_STATUS.awaitingDropOff]: {
    label: "Awaiting Drop-off",
    color: "var(--status-warning)",
    bg: "var(--status-warning-bg)",
  },
  [HANDOFF_STATUS.parcelReceivedAtOrigin]: {
    label: "Received at Origin",
    color: "var(--status-info)",
    bg: "var(--status-info-bg)",
  },
  [HANDOFF_STATUS.riderAssigned]: {
    label: "Rider Assigned",
    color: "var(--status-info)",
    bg: "var(--status-info-bg)",
  },
  [HANDOFF_STATUS.inTransit]: {
    label: "In Transit",
    color: "var(--status-warning)",
    bg: "var(--status-warning-bg)",
  },
  [HANDOFF_STATUS.arrivedAtDestination]: {
    label: "Arrived at Destination",
    color: "var(--status-success)",
    bg: "var(--status-success-bg)",
  },
};

/** Turns `some_unknown_status` into "Some Unknown Status" so an unmapped value still reads as English. */
function humanize(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface HandoffStatusPillProps {
  status: OrderStatus;
  className?: string;
}

export function HandoffStatusPill({ status, className }: HandoffStatusPillProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: humanize(status),
    color: "var(--status-neutral)",
    bg: "var(--status-neutral-bg)",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap",
        className
      )}
      style={{ color: config.color, background: config.bg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: config.color }}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
