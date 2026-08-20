"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { HANDOFF_STATUS } from "@/core/types";
import type { NodeOrderSummary } from "@/core/types";

/**
 * Every order that's ever touched this Node — `GET /handoffs/my-node/orders`,
 * real and confirmed per docs/API.md (2026-08-17). This is the server-backed
 * replacement for `store/node-outgoing.store.ts` and
 * `store/node-parcels.store.ts` (both deleted): the operator no longer needs
 * a device-local cache to resolve the order uuid `confirm-handoff`/`intake`/
 * `collect` need, because the server can now list every order this Node has
 * a stake in, on either side.
 *
 * Consumed by `NodeHomeScreen`'s three tabs (Awaiting Pickup/Awaiting
 * Arrival/Ready for Collection — moved here 2026-08-17 when the
 * standalone Inventory screen was retired), `HandoffDetailScreen` (one
 * order's pickup/arrival details + code entry), `CollectParcelScreen`
 * (the receiver-collection + check-in form), and `ActivityScreen`'s
 * Order History tab (the old Inventory History tab, relocated). All
 * filters below are re-derived from one query rather than separate
 * fetches, since it's the same list sliced by `myRole` + `status`.
 */
export function useMyNodeOrders() {
  const query = useQuery({
    queryKey: QUERY_KEYS.nodeMyOrders,
    queryFn: () => nodeService.getMyNodeOrders(),
  });

  const orders = useMemo(() => query.data ?? [], [query.data]);

  return {
    orders,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * One order by id, from the same cached list — no separate fetch.
 * Powers `HandoffDetailScreen`: the Awaiting Pickup/Awaiting Arrival
 * details page is keyed on `orderId` alone, and every field it shows
 * (tracking code, status, parcel, route, `myRole`) is already present
 * on `NodeOrderSummary`. `undefined` once loaded means this Node has no
 * order with that id — a stale link, not a fetch failure.
 */
export function useNodeOrder(orderId: string) {
  const { orders, isLoading } = useMyNodeOrders();

  return {
    order: orders.find((o) => o.id === orderId),
    isLoading,
  };
}

/** Origin side, not yet handed to a rider — the pickup pick-list. */
export function isAwaitingPickup(order: Pick<NodeOrderSummary, "myRole" | "status">): boolean {
  return (
    order.myRole === "origin" &&
    (order.status === HANDOFF_STATUS.parcelReceivedAtOrigin ||
      order.status === HANDOFF_STATUS.riderAssigned)
  );
}

/** Destination side, rider en route but not yet confirmed arrived — the arrival pick-list. */
export function isAwaitingArrival(order: Pick<NodeOrderSummary, "myRole" | "status">): boolean {
  return order.myRole === "destination" && order.status === HANDOFF_STATUS.inTransit;
}

/** Destination side, arrived but the receiver hasn't been emailed a collection code yet. */
export function needsIntake(order: Pick<NodeOrderSummary, "myRole" | "status">): boolean {
  return order.myRole === "destination" && order.status === HANDOFF_STATUS.arrivedAtDestination;
}

/** Destination side, checked in and waiting on the receiver. */
export function isReadyForCollection(order: Pick<NodeOrderSummary, "myRole" | "status">): boolean {
  return order.myRole === "destination" && order.status === HANDOFF_STATUS.readyForCollection;
}
