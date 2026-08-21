"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import type { AdminOrderFilters } from "@/core/types";

const DEFAULT_FILTERS: AdminOrderFilters = { search: "", status: "all", nodeId: "all" };

/**
 * Admin order list — no backend route exists for an admin-scoped,
 * filterable order listing (see `admin.service.ts`), so `orders`
 * stays empty and filtering happens client-side against whatever the
 * (currently always-empty) query returns. The filter UI itself is
 * still fully built so it's a drop-in once the endpoint exists.
 */
export function useAdminOrders() {
  const [filters, setFilters] = useState<AdminOrderFilters>(DEFAULT_FILTERS);

  const query = useQuery({
    queryKey: QUERY_KEYS.adminOrders,
    queryFn: () => adminService.getOrders(),
    retry: false,
  });

  const orders = useMemo(() => query.data ?? [], [query.data]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filters.status !== "all" && order.status !== filters.status) return false;
      if (filters.search) {
        const needle = filters.search.toLowerCase();
        const haystack = `${order.trackingCode} ${order.customerName}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [orders, filters]);

  return {
    orders: filteredOrders,
    isLoading: query.isLoading,
    filters,
    setFilters,
    resetFilters: () => setFilters(DEFAULT_FILTERS),
  };
}
