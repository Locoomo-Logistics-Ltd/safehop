"use client";

import { useMemo } from "react";
import { isActiveDelivery, nextHandoffType, useMyOrders } from "@/modules/rider/hooks/use-my-orders";
import { RIDER_MAX_CONCURRENT_DELIVERIES } from "@/core/types";

/**
 * The rider's currently-active deliveries — the two legs still on their
 * plate (`rider_assigned` awaiting a pickup code, `in_transit` awaiting
 * an arrival code), sliced from `GET /handoffs/my-orders`'s full history.
 */
export function useActiveDeliveries() {
  const { orders, isLoading, refetch } = useMyOrders();

  const active = useMemo(() => orders.filter(isActiveDelivery), [orders]);

  return {
    deliveries: active,
    isLoading,
    refetch,
    /** Mirrors the server's own cap — lets the board warn before an accept that would 409. */
    isAtCapacity: active.length >= RIDER_MAX_CONCURRENT_DELIVERIES,
    remainingCapacity: Math.max(0, RIDER_MAX_CONCURRENT_DELIVERIES - active.length),
  };
}

/** One delivery by id, for the handoff screen. `undefined` once loaded means it isn't currently active for this rider. */
export function useActiveDelivery(orderId: string) {
  const { deliveries, isLoading } = useActiveDeliveries();

  const delivery = useMemo(
    () => deliveries.find((item) => item.id === orderId),
    [deliveries, orderId]
  );

  return {
    delivery,
    isLoading,
    handoffType: delivery ? nextHandoffType(delivery) : null,
  };
}
