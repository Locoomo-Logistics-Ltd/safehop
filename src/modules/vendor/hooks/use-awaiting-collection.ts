"use client";

import { useEffect } from "react";
import { useNodeParcelsStore } from "@/store/node-parcels.store";

/**
 * The parcels currently sitting at this Node between the rider handing
 * them over and the receiver collecting them.
 *
 * Reads from `store/node-parcels.store.ts` rather than the API, because
 * no destination-scoped list or lookup exists — read that store's header
 * before building anything else on top of this.
 *
 * Hydration runs in an effect rather than during render: the store is
 * localStorage-backed, so reading it while rendering would produce
 * server/client markup that disagrees. `isHydrated` lets a screen tell
 * "nothing here" apart from "not read yet" and avoid flashing an empty
 * state over a list that's about to appear.
 */
export function useAwaitingCollection() {
  const parcels = useNodeParcelsStore((s) => s.parcels);
  const isHydrated = useNodeParcelsStore((s) => s.isHydrated);
  const hydrate = useNodeParcelsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return { parcels, isHydrated };
}

/** One parcel by order id, for the collect screen. `undefined` once hydrated means it isn't on this device. */
export function useAwaitingCollectionParcel(orderId: string) {
  const { parcels, isHydrated } = useAwaitingCollection();

  return {
    parcel: parcels.find((p) => p.id === orderId),
    isHydrated,
  };
}
