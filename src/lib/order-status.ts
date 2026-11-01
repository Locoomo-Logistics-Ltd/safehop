import type { OrderStatus } from "@/core/types";

/**
 * One place that knows what each order status means to a person.
 * Replaces the keyword matching (`includes("collect")`) that put
 * `ready_for_collection` — the receiver hasn't collected yet — in the
 * "completed" bucket. Unknown statuses fall through to a neutral
 * "in progress" so a status added later never breaks a screen.
 */

export type StatusTone = "info" | "success" | "danger" | "warning";

interface StatusMeta {
  label: string;
  tone: StatusTone;
  /** 0..1 along the forward route for `RouteRail`. */
  progress: number;
  /** Nothing more will happen to this order. */
  isFinal: boolean;
  track: "forward" | "return" | "closed";
}

const STATUS_META: Record<string, StatusMeta> = {
  awaiting_drop_off: { label: "Awaiting drop-off", tone: "warning", progress: 0, isFinal: false, track: "forward" },
  parcel_received_at_origin: { label: "At origin station", tone: "info", progress: 0.15, isFinal: false, track: "forward" },
  rider_assigned: { label: "Courier assigned", tone: "info", progress: 0.3, isFinal: false, track: "forward" },
  in_transit: { label: "On the way", tone: "info", progress: 0.6, isFinal: false, track: "forward" },
  arrived_at_destination: { label: "Arrived at destination", tone: "info", progress: 0.85, isFinal: false, track: "forward" },
  ready_for_collection: { label: "Ready for collection", tone: "success", progress: 0.95, isFinal: false, track: "forward" },
  completed: { label: "Collected", tone: "success", progress: 1, isFinal: true, track: "forward" },
  return_initiated: { label: "Return started", tone: "warning", progress: 0.6, isFinal: false, track: "return" },
  return_in_transit: { label: "Returning to sender", tone: "warning", progress: 0.4, isFinal: false, track: "return" },
  returned_to_origin: { label: "Back at origin station", tone: "warning", progress: 0.1, isFinal: false, track: "return" },
  ready_for_sender_collection: { label: "Ready for you to collect", tone: "warning", progress: 0.05, isFinal: false, track: "return" },
  return_completed: { label: "Returned to sender", tone: "success", progress: 0, isFinal: true, track: "return" },
  cancelled: { label: "Cancelled", tone: "danger", progress: 0, isFinal: true, track: "closed" },
  disputed: { label: "Under review", tone: "danger", progress: 0, isFinal: false, track: "closed" },
};

const FALLBACK: StatusMeta = { label: "In progress", tone: "info", progress: 0.5, isFinal: false, track: "forward" };

/** Humanizes an unknown `snake_case` status so it still reads as text. */
function humanize(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getOrderStatusMeta(status: OrderStatus): StatusMeta {
  return STATUS_META[status] ?? { ...FALLBACK, label: humanize(status) };
}

export const isFinalOrderStatus = (status: OrderStatus) => getOrderStatusMeta(status).isFinal;
export const isReturnStatus = (status: OrderStatus) => getOrderStatusMeta(status).track === "return";

/** Polling for a sender's order detail stops once nothing more can change (docs/LOGISTICS_API.md §10). */
export const STOP_POLLING_STATUSES: readonly OrderStatus[] = ["completed", "return_completed", "cancelled"];
