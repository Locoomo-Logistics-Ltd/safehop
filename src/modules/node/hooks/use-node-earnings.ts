"use client";

import { useQuery } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/**
 * `GET /earnings/my-node` — real, confirmed route per docs/API.md.
 * This account's Node revenue-split entries: a `node` row per order
 * where one of its stations was the origin, a `destination_node` row
 * per order where one was the destination. Not splittable by station —
 * the response carries no node id.
 */
export function useNodeEarnings() {
  const query = useQuery({
    queryKey: QUERY_KEYS.nodeEarnings,
    queryFn: () => nodeService.getMyNodeEarnings(),
    retry: false,
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
  };
}
