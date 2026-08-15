"use client";

import { useEffect, useMemo } from "react";
import {
  isDeliveryComplete,
  nextHandoffType,
  useRiderJobsStore,
} from "@/store/rider-jobs.store";
import { RIDER_MAX_CONCURRENT_DELIVERIES } from "@/core/types";

/**
 * The rider's accepted deliveries, read from the device-local store.
 *
 * The store reads localStorage, which the server render can't see, so
 * hydration is kicked off from an effect rather than at module load —
 * rendering the list straight from storage would mismatch the server's
 * empty markup. `isHydrated` is what lets a screen distinguish "this
 * rider has no deliveries" from "we haven't looked yet"; treating the
 * first paint as empty would flash a wrong empty state on every load.
 */
export function useActiveDeliveries() {
  const deliveries = useRiderJobsStore((state) => state.deliveries);
  const isHydrated = useRiderJobsStore((state) => state.isHydrated);
  const hydrate = useRiderJobsStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const active = useMemo(
    () => deliveries.filter((delivery) => !isDeliveryComplete(delivery)),
    [deliveries]
  );

  return {
    deliveries: active,
    isHydrated,
    /** Mirrors the server's own cap — lets the board warn before an accept that would 409. */
    isAtCapacity: active.length >= RIDER_MAX_CONCURRENT_DELIVERIES,
    remainingCapacity: Math.max(0, RIDER_MAX_CONCURRENT_DELIVERIES - active.length),
  };
}

/** One delivery by id, for the handoff screen. `undefined` once hydrated means it isn't on this device. */
export function useActiveDelivery(orderId: string) {
  const { deliveries, isHydrated } = useActiveDeliveries();

  const delivery = useMemo(
    () => deliveries.find((item) => item.id === orderId),
    [deliveries, orderId]
  );

  return {
    delivery,
    isHydrated,
    handoffType: delivery ? nextHandoffType(delivery) : null,
  };
}
