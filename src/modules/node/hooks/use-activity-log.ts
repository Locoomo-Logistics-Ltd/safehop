"use client";

import { useQuery } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** Fetches the Node operator's activity log for the Activity tab. */
export function useActivityLog() {
  const query = useQuery({
    queryKey: QUERY_KEYS.nodeActivity,
    queryFn: () => nodeService.listActivity(),
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
