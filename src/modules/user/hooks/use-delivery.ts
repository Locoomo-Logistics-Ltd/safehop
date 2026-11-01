"use client";

import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { STOP_POLLING_STATUSES } from "@/lib/order-status";

/**
 * Fetches a single order by id (`GET /orders/:id`) — used by both the
 * success and tracking screens. Refreshes every 30 s while the tab is
 * visible (TanStack pauses interval refetches in a hidden tab) and stops
 * once the order can't change any more (docs/LOGISTICS_API.md §10).
 */
export function useDelivery(id: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.delivery(id),
    queryFn: () => deliveryService.getById(id),
    enabled: !!id,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status && STOP_POLLING_STATUSES.includes(status) ? false : 30_000;
    },
  });

  return {
    delivery: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/** `GET /orders/:id/timeline` — the history, oldest first. Refetched alongside the order. */
export function useOrderTimeline(id: string, status?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.orderTimeline(id), status],
    queryFn: () => deliveryService.getTimeline(id),
    enabled: !!id,
  });
}
