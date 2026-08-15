"use client";

import { useQuery } from "@tanstack/react-query";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/**
 * Fetches a single node parcel by id, from the Node Dashboard's
 * inventory list — used by the Flag Issue screen.
 *
 * `useShelfLocations`/`useAssignShelf` used to live here and were
 * removed 2026-08-15 along with the Scan Success screen: neither had a
 * backend route (`listShelves` returned `[]`, `assignShelf` threw
 * NOT_IMPLEMENTED), and shelf assignment doesn't appear in docs/API.md
 * at all. Rebuild them against a real endpoint if the feature returns.
 */
export function useNodeParcel(parcelId: string) {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.vendorParcels, parcelId],
    queryFn: async () => {
      const all = await vendorService.listParcels();
      const found = all.find((p) => p.id === parcelId);
      if (!found) throw new Error("Parcel not found");
      return found;
    },
    enabled: !!parcelId,
  });

  return {
    parcel: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
