import { cn } from "@/lib/utils";
import type { ParcelNodeStatus } from "@/core/types";

interface NodeParcelStatusBadgeProps {
  status: ParcelNodeStatus;
  className?: string;
}

const STATUS_CONFIG: Record<ParcelNodeStatus, { label: string; color: string; bg: string }> = {
  awaiting_pickup: { label: "Awaiting Pickup", color: "var(--status-warning)", bg: "var(--status-warning-bg)" },
  checked_in: { label: "Checked In", color: "var(--status-info)", bg: "var(--status-info-bg)" },
  ready_for_collection: { label: "Ready", color: "var(--status-success)", bg: "var(--status-success-bg)" },
  awaiting_rider: { label: "Awaiting Rider", color: "var(--status-warning)", bg: "var(--status-warning-bg)" },
  released: { label: "Released", color: "var(--status-success)", bg: "var(--status-success-bg)" },
  delayed: { label: "Delayed", color: "var(--status-danger)", bg: "var(--status-danger-bg)" },
  flagged: { label: "Flagged", color: "var(--status-danger)", bg: "var(--status-danger-bg)" },
};

/** Status pill for vendor-managed parcels — distinct status set from the User-facing StatusBadge. */
export function NodeParcelStatusBadge({ status, className }: NodeParcelStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0",
        className
      )}
      style={{ color: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  );
}
