"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/**
 * Dashboard summary — stats, recent orders, network status. All three
 * calls hit `adminService` methods that currently throw
 * `NOT_IMPLEMENTED` (no backend route exists yet, see
 * `admin.service.ts`'s header), so `data` stays `undefined` and the
 * screen falls back to placeholders — same convention as
 * `use-job-history.ts` for the Rider role. `AdminTopBar`'s refresh
 * button invalidates every `["admin", ...]` query directly, so this
 * hook doesn't need to expose its own refresh helper.
 */
export function useAdminDashboard() {
  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.adminDashboardStats,
    queryFn: () => adminService.getDashboardStats(),
    retry: false,
  });

  const recentOrdersQuery = useQuery({
    queryKey: QUERY_KEYS.adminRecentOrders,
    queryFn: () => adminService.getRecentOrders(),
    retry: false,
  });

  const networkStatusQuery = useQuery({
    queryKey: QUERY_KEYS.adminNetworkStatus,
    queryFn: () => adminService.getNetworkStatusSummary(),
    retry: false,
  });

  return {
    stats: statsQuery.data,
    isStatsLoading: statsQuery.isLoading,
    recentOrders: recentOrdersQuery.data ?? [],
    isRecentOrdersLoading: recentOrdersQuery.isLoading,
    networkStatus: networkStatusQuery.data,
    isNetworkStatusLoading: networkStatusQuery.isLoading,
  };
}
