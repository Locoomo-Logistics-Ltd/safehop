"use client";

import { useMemo } from "react";
import {
  needsIntake,
  isReadyForCollection,
  useMyNodeOrders,
} from "@/modules/node/hooks/use-my-node-orders";

/**
 * The parcels currently sitting at this Node between the rider handing
 * them over and the receiver collecting them.
 *
 * Sourced from `GET /handoffs/my-node/orders` (`use-my-node-orders.ts`)
 * rather than a device-local cache — `store/node-parcels.store.ts` (the
 * previous, localStorage-backed version of this hook) is deleted, since
 * the server can now answer this directly.
 */
export function useAwaitingCollection() {
  const { orders, isLoading, refetch } = useMyNodeOrders();

  const parcels = useMemo(
    () => orders.filter((o) => needsIntake(o) || isReadyForCollection(o)),
    [orders]
  );

  return { parcels, isLoading, refetch };
}

/** One parcel by order id, for the collect screen. `undefined` once loaded means it isn't at this Node's destination-side counter. */
export function useAwaitingCollectionParcel(orderId: string) {
  const { parcels, isLoading } = useAwaitingCollection();

  return {
    parcel: parcels.find((p) => p.id === orderId),
    isLoading,
  };
}
