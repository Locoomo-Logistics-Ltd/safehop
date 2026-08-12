import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/core/types";

const TERMINAL_SUCCESS_KEYWORDS = ["complete", "deliver", "collect"];
const TERMINAL_FAILURE_KEYWORDS = ["cancel", "fail", "expire"];

/**
 * Color-coded status pill for the real `Order.status` — docs/API.md
 * only confirms one value (`"awaiting_drop_off"`), so this can't use
 * `StatusBadge`'s fixed `DeliveryStatus` lookup table (that type
 * belongs to the older, undocumented delivery model — see
 * delivery.types.ts). Any raw status renders as humanized text with a
 * best-effort color from keyword matching, so an unrecognized value
 * degrades gracefully instead of crashing or looking broken.
 */
export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const lower = status.toLowerCase();
  const isSuccess = TERMINAL_SUCCESS_KEYWORDS.some((k) => lower.includes(k));
  const isFailure = TERMINAL_FAILURE_KEYWORDS.some((k) => lower.includes(k));

  const color = isSuccess ? "var(--status-success)" : isFailure ? "var(--status-danger)" : "var(--status-info)";
  const bg = isSuccess ? "var(--status-success-bg)" : isFailure ? "var(--status-danger-bg)" : "var(--status-info-bg)";
  const label = status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

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

/** Best-effort 0..1 progress for `RouteRail` — see this file's header on why the full lifecycle can't be enumerated yet. */
export function getOrderProgress(status: OrderStatus): number {
  const lower = status.toLowerCase();
  if (TERMINAL_SUCCESS_KEYWORDS.some((k) => lower.includes(k))) return 1;
  if (TERMINAL_FAILURE_KEYWORDS.some((k) => lower.includes(k))) return 0;
  if (lower === "awaiting_drop_off") return 0;
  return 0.5;
}

/** Heuristic active/past split for the dashboard — see this file's header; only `"awaiting_drop_off"` is a confirmed value. */
export function isTerminalOrderStatus(status: OrderStatus): boolean {
  const lower = status.toLowerCase();
  return TERMINAL_SUCCESS_KEYWORDS.some((k) => lower.includes(k)) || TERMINAL_FAILURE_KEYWORDS.some((k) => lower.includes(k));
}
