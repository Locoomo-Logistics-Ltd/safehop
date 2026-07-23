"use client";

import { useQuery } from "@tanstack/react-query";
import { riderService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** Fetches earnings summary — used on both the Home dashboard and Profile stat cards. */
export function useRiderEarnings() {
  const query = useQuery({
    queryKey: QUERY_KEYS.riderEarnings,
    queryFn: () => riderService.getEarningsSummary(),
  });

  return {
    earnings: query.data,
    isLoading: query.isLoading,
  };
}
