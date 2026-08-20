import { formatCurrency, formatDate } from "@/lib/format";
import type { MyRevenueSplitEntry } from "@/core/types";

interface EarningsEntryRowProps {
  entry: MyRevenueSplitEntry;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "var(--status-warning)", bg: "var(--status-warning-bg)" },
  paid: { label: "Paid", color: "var(--status-success)", bg: "var(--status-success-bg)" },
} as const;

/** One row in "Earnings" — date, tracking code, amount, payout status. */
export function EarningsEntryRow({ entry }: EarningsEntryRowProps) {
  const config = STATUS_CONFIG[entry.payoutStatus];

  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-xl bg-bg-card border border-border-default border-l-[3px]"
      style={{ borderLeftColor: config.color }}
    >
      <div className="w-14 shrink-0">
        <p className="text-[11px] font-semibold text-text-primary">{formatDate(entry.createdAt)}</p>
      </div>

      <div className="flex-1 min-w-0 text-[12px] text-text-secondary font-mono truncate">
        {entry.orderTrackingCode}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[12px] font-semibold text-text-primary">
          {formatCurrency(entry.amountKobo / 100)}
        </span>
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
