"use client";

import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** Fetches a single order by id (`GET /orders/:id`) — used by both the success and tracking screens. */
export function useDelivery(id: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.delivery(id),
    queryFn: () => deliveryService.getById(id),
    enabled: !!id,
  });

  return {
    delivery: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
