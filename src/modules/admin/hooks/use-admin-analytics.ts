"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** No analytics endpoints exist yet — see `admin.service.ts`. */
export function useAdminAnalytics() {
  const summaryQuery = useQuery({
    queryKey: QUERY_KEYS.adminAnalyticsSummary,
    queryFn: () => adminService.getAnalyticsSummary(),
    retry: false,
  });

  const trendQuery = useQuery({
    queryKey: QUERY_KEYS.adminOrdersTrend,
    queryFn: () => adminService.getOrdersTrend(),
    retry: false,
  });

  const topNodesQuery = useQuery({
    queryKey: QUERY_KEYS.adminTopNodes,
    queryFn: () => adminService.getTopNodes(),
    retry: false,
  });

  const riderPerformanceQuery = useQuery({
    queryKey: QUERY_KEYS.adminRiderPerformance,
    queryFn: () => adminService.getRiderPerformance(),
    retry: false,
  });

  return {
    summary: summaryQuery.data,
    isSummaryLoading: summaryQuery.isLoading,
    trend: trendQuery.data ?? [],
    isTrendLoading: trendQuery.isLoading,
    topNodes: topNodesQuery.data ?? [],
    isTopNodesLoading: topNodesQuery.isLoading,
    riderPerformance: riderPerformanceQuery.data ?? [],
    isRiderPerformanceLoading: riderPerformanceQuery.isLoading,
  };
}
