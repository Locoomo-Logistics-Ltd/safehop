"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/**
 * GET /admin/capacity-audit — real, confirmed route per docs/API.md.
 * Read-only reconciliation report; no automatic polling — an Admin
 * pulls this on demand (`refetch`), same "don't auto-poll a diagnostic"
 * convention as `useRevenueSplitEntries`.
 */
export function useCapacityAudit() {
  const query = useQuery({
    queryKey: QUERY_KEYS.adminCapacityAudit,
    queryFn: () => adminService.getCapacityAudit(),
    retry: false,
  });

  return {
    report: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
