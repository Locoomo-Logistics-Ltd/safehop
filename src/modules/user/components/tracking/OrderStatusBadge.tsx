import { cn } from "@/lib/utils";
import { getOrderStatusMeta, type StatusTone } from "@/lib/order-status";
import type { OrderStatus } from "@/core/types";

const TONE_COLORS: Record<StatusTone, { color: string; bg: string }> = {
  info: { color: "var(--status-info)", bg: "var(--status-info-bg)" },
  success: { color: "var(--status-success)", bg: "var(--status-success-bg)" },
  danger: { color: "var(--status-danger)", bg: "var(--status-danger-bg)" },
  warning: { color: "var(--status-warning)", bg: "var(--status-warning-bg)" },
};

/** Color-coded status pill for `Order.status`, driven by the explicit lifecycle in `lib/order-status`. */
export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { label, tone } = getOrderStatusMeta(status);
  const { color, bg } = TONE_COLORS[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap",
        className
      )}
      style={{ color, background: bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

/** 0..1 progress for `RouteRail`. */
export function getOrderProgress(status: OrderStatus): number {
  return getOrderStatusMeta(status).progress;
}
