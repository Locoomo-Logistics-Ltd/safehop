"use client";

import { TopBar } from "@/components/layout";
import { EmptyState } from "@/components/ui";
import { ActivityIcon } from "@/components/icons";
import { getHandoffStatusLabel } from "@/modules/node/components/handoff/HandoffStatusPill";
import { useMyNodeOrders } from "@/modules/node/hooks/use-my-node-orders";
import { HANDOFF_STATUS } from "@/core/types";
import type { ActivityEventType, ActivityLogEntry, NodeOrderSummary } from "@/core/types";
import { ActivityLogItem } from "./ActivityLogItem";

/** Picks the icon/type an order's real status is closest to, among the existing `ActivityEventType` set — no new icon, no invented event. */
function activityEntryType(order: NodeOrderSummary): ActivityEventType {
  switch (order.status) {
    case HANDOFF_STATUS.parcelReceivedAtOrigin:
    case HANDOFF_STATUS.riderAssigned:
    case HANDOFF_STATUS.arrivedAtDestination:
      // Physically just landed at this Node — from the consumer at
      // origin, or from a rider at destination.
      return "batch_received";
    case HANDOFF_STATUS.inTransit:
      // With a rider right now, whichever side of the trip this is.
      return "handoff_to_rider";
    case HANDOFF_STATUS.readyForCollection:
      // Checked in, shelved, waiting on the receiver.
      return "parcel_checked_in";
    case HANDOFF_STATUS.completed:
      return "parcel_released";
    default:
      // awaiting_drop_off, or any status this build hasn't caught up
      // with yet — fall back to which side of the trip this Node is on.
      return order.myRole === "origin" ? "handoff_to_rider" : "parcel_checked_in";
  }
}

/**
 * Maps one `GET /handoffs/my-node/orders` order into the Activity Log's
 * card shape. Nothing here is invented: tracking code, description,
 * origin/destination names, `createdAt`, and `status` are all real
 * `NodeOrderSummary` fields; `type` (the icon) is derived from the
 * order's real `status` via `activityEntryType()`; `tag` carries the
 * status label via `getHandoffStatusLabel`, reusing `HandoffStatusPill`'s
 * own map so the two never disagree on wording. `isException` is always
 * `false` — the API has no exception/flag concept on an order, only a
 * status, so nothing here claims one.
 */
function mapOrderToActivityEntry(order: NodeOrderSummary): ActivityLogEntry {
  const isOutgoing = order.myRole === "origin";
  return {
    id: order.id,
    type: activityEntryType(order),
    title: order.trackingCode,
    description: isOutgoing
      ? `${order.parcelDescription} → ${order.destinationNodeName}`
      : `${order.parcelDescription} ← ${order.originNodeName}`,
    timestamp: order.createdAt,
    isException: false,
    tag: getHandoffStatusLabel(order.status),
  };
}

/**
 * Activity tab — a single chronological timeline, sourced from
 * `GET /handoffs/my-node/orders` (every order that's ever touched this
 * Node, either side), rendered with `ActivityLogItem`.
 *
 * The API returns the list newest-first, and nothing here re-sorts it —
 * the most recent order is always the first row, right at the top of
 * the screen. The hardcoded `RiderHandoffToast` demo card ("LC-482TX",
 * "Tunde A.", fixed at "2 mins ago") that used to sit above the list is
 * deleted, not just unused — it was fabricated data occupying the exact
 * spot the real most-recent activity now sits in.
 *
 * `useMyNodeOrders()` is already fetched elsewhere in the app (Home,
 * the handoff details page), so TanStack Query dedupes rather than
 * firing an extra request within the query's staleTime.
 *
 * The notification-backed integration this screen used before
 * (`useActivityLog`, `nodeService.listActivity()`, a real, working
 * `GET /notifications/user/{userId}` call) is left in place but has no
 * caller left in the app — worth a product decision (delete it, or
 * wire it to a future notifications surface) rather than a silent
 * removal here.
 */
export function ActivityScreen() {
  const { orders, isLoading } = useMyNodeOrders();

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Activity" />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-8 max-w-[560px] mx-auto">
        <h1 className="hidden md:block font-display text-[22px] font-bold text-text-primary mb-6">
          Activity
        </h1>

        <h2 className="font-semibold text-[14px] text-text-primary mb-3">Activity Log</h2>

        {isLoading ? (
          <p className="text-[13px] text-text-muted text-center py-10">Loading activity…</p>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ActivityIcon size={24} />}
            title="No activity yet"
            description="Orders that touch your Node — as a drop-off point or a destination — will show up here."
          />
        ) : (
          <div>
            {orders.map((order, i) => (
              <ActivityLogItem
                key={order.id}
                entry={mapOrderToActivityEntry(order)}
                isLast={i === orders.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
