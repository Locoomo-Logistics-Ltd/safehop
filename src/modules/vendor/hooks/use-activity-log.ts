"use client";

import { useQuery } from "@tanstack/react-query";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** Fetches the vendor's activity log for the Activity tab. */
export function useActivityLog() {
  const query = useQuery({
    queryKey: QUERY_KEYS.vendorActivity,
    queryFn: () => vendorService.listActivity(),
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
