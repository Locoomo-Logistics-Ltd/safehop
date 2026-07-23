"use client";

import { useQuery } from "@tanstack/react-query";
import { nodesService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { useGeolocation } from "@/hooks/use-geolocation";

/**
 * Fetches nearby Pickup Stations for the Select Nodes screen. Waits
 * for a live position from useGeolocation before querying — the real
 * API's /nodes/nearby needs a reference point to search around.
 */
export function useNodes() {
  const { position, isLoading: isLocating } = useGeolocation();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.nodes, position?.lat, position?.lng],
    queryFn: () => nodesService.listNearby(position!),
    enabled: !!position,
  });

  return {
    nodes: query.data ?? [],
    isLoading: isLocating || query.isLoading,
    isError: query.isError,
  };
}
