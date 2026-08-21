"use client";

import { useQuery } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** `GET /earnings/my-node` — real, confirmed route per docs/API.md. This Node's own revenue-split entries (origin-Node orders only). */
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
