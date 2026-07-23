"use client";

import { useQuery } from "@tanstack/react-query";
import { riderService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** Fetches the rider's currently active (accepted/picked-up) job. */
export function useActiveJob() {
  const query = useQuery({
    queryKey: QUERY_KEYS.riderActiveJob,
    queryFn: () => riderService.getActiveJob(),
  });

  return {
    job: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
