"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { riderService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { HANDOFF_STATUS } from "@/core/types";
import type { MyOrderSummary } from "@/core/types";

/**
 * Every order this rider has ever been assigned — `GET /handoffs/my-orders`,
 * real and confirmed per docs/API.md (2026-08-17). Server-backed replacement
 * for `store/rider-jobs.store.ts` (deleted): the rider no longer needs a
 * device-local cache to remember which orders they hold, since the server
 * can now list them directly, current and past, on any device they sign
 * into.
 *
 * Returns the full history — `isActiveDelivery` below is what narrows it to
 * "still needs this rider's action," which is what `ActiveDeliveriesScreen`
 * actually wants.
 */
export function useMyOrders() {
  const query = useQuery({
    queryKey: QUERY_KEYS.riderMyOrders,
    queryFn: () => riderService.getMyOrders(),
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
 * Still owes the rider an action: a pickup code at the origin
 * (`rider_assigned`) or an arrival code at the destination
 * (`in_transit`). Anything earlier means this rider was never assigned
 * it yet; anything later (`arrived_at_destination` onward) is out of
 * the rider's hands.
 */
export function isActiveDelivery(order: Pick<MyOrderSummary, "status">): boolean {
  return (
    order.status === HANDOFF_STATUS.riderAssigned ||
    order.status === HANDOFF_STATUS.inTransit
  );
}

/** Which handoff the rider is heading into next: pickup until the origin operator confirms `rider_pickup`, arrival after that. */
export function nextHandoffType(
  order: Pick<MyOrderSummary, "status">
): "rider_pickup" | "rider_arrival" {
  return order.status === HANDOFF_STATUS.inTransit ? "rider_arrival" : "rider_pickup";
}
