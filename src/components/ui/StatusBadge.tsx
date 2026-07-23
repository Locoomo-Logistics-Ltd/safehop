import * as React from "react";
import { cn } from "@/lib/utils";
import type { DeliveryStatus } from "@/core/types";

interface StatusBadgeProps {
  status: DeliveryStatus;
  className?: string;
}

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
  pending_payment: { label: "Pending Payment", color: "var(--status-warning)", bg: "var(--status-warning-bg)" },
  package_dropped: { label: "Package Dropped", color: "var(--status-info)", bg: "var(--status-info-bg)" },
  in_transit: { label: "In Transit", color: "var(--status-warning)", bg: "var(--status-warning-bg)" },
  arrived_at_node: { label: "Arrived at Node", color: "var(--status-info)", bg: "var(--status-info-bg)" },
  ready_for_collection: { label: "Ready for Collection", color: "var(--status-success)", bg: "var(--status-success-bg)" },
  completed: { label: "Completed", color: "var(--status-success)", bg: "var(--status-success-bg)" },
  cancelled: { label: "Cancelled", color: "var(--status-danger)", bg: "var(--status-danger-bg)" },
};

/** Color-coded status pill. The single canonical place status copy/color is defined. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap",
        className
      )}
      style={{ color: config.color, background: config.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.color }} aria-hidden="true" />
      {config.label}
    </span>
  );
}
