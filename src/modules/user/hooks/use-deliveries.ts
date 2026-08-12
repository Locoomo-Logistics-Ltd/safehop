"use client";

import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isTerminalOrderStatus } from "@/modules/user/components/tracking/OrderStatusBadge";

/**
 * Fetches all of the Consumer's own orders (`GET /orders`) and splits
 * them into active vs. past for the dashboard — rebuilt 2026-08-12
 * against the real `Order` type. The active/past split is a
 * best-effort heuristic (see `isTerminalOrderStatus`), since
 * docs/API.md only confirms one status value (`"awaiting_drop_off"`)
 * and doesn't enumerate the full order lifecycle.
 */
export function useDeliveries() {
  const query = useQuery({
    queryKey: QUERY_KEYS.deliveries,
    queryFn: () => deliveryService.list(),
  });

  const deliveries = query.data ?? [];
  const active = deliveries.filter((d) => !isTerminalOrderStatus(d.status));
  const past = deliveries.filter((d) => isTerminalOrderStatus(d.status));

  return {
    deliveries,
    active,
    past,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
