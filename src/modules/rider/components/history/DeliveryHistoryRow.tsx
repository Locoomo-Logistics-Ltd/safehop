import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DeliveryJob } from "@/core/types";

interface DeliveryHistoryRowProps {
  job: DeliveryJob;
}

const STATUS_CONFIG = {
  delivered: { label: "Completed", color: "var(--status-success)", bg: "var(--status-success-bg)" },
  declined: { label: "Declined", color: "var(--status-danger)", bg: "var(--status-danger-bg)" },
  expired: { label: "Expired", color: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
} as const;

/** One row in "My Deliveries" — date, route, payout, status. Matches Figma list. */
export function DeliveryHistoryRow({ job }: DeliveryHistoryRowProps) {
  const config =
    STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.delivered;
  const dateLabel = formatDate(job.deliveredAt ?? job.createdAt);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-[12px] bg-bg-card border border-border-default",
        "border-l-[3px]"
      )}
      style={{ borderLeftColor: config.color }}
    >
      <div className="w-14 shrink-0">
        <p className="text-[11px] font-semibold text-text-primary">{dateLabel}</p>
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-1.5 text-[12px] text-text-secondary">
        <span className="truncate">{job.pickup.label}</span>
        <span className="text-text-muted shrink-0">→</span>
        <span className="truncate font-medium">{job.dropoff.label}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {job.status === "delivered" && (
          <span className="text-[12px] font-semibold text-text-primary">
            {formatCurrency(job.payout)}
          </span>
        )}
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ color: config.color, background: config.bg }}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}
