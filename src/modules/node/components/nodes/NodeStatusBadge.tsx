import { cn } from "@/lib/utils";
import type { NodeOperatorNodeStatus } from "@/core/types";

const NODE_STATUS_CONFIG: Record<
  NodeOperatorNodeStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending review", color: "var(--status-warning)", bg: "var(--status-warning-bg)" },
  active: { label: "Active", color: "var(--status-success)", bg: "var(--status-success-bg)" },
  inactive: { label: "Inactive", color: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
  suspended: { label: "Suspended", color: "var(--status-danger)", bg: "var(--status-danger-bg)" },
};

/**
 * A Node's own approval status, as a pill. Distinct from
 * `components/ui/StatusBadge` (an *order's* delivery status) and
 * `HandoffStatusPill` (a parcel's custody state) — this is the one
 * that answers "can this station take parcels yet," which matters per
 * Node now that an operator runs several at different approval stages.
 */
export function NodeStatusBadge({
  status,
  className,
}: {
  status: NodeOperatorNodeStatus;
  className?: string;
}) {
  const config = NODE_STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap",
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
