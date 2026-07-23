"use client";

import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import type { Delivery, DeliveryStatus } from "@/core/types";

const ACTIVE_STATUSES: DeliveryStatus[] = [
  "pending_payment",
  "package_dropped",
  "in_transit",
  "arrived_at_node",
  "ready_for_collection",
];

/**
 * Fetches all deliveries for the current user and splits them into
 * active vs. past — the exact split shown on the dashboard in Figma.
 */
export function useDeliveries() {
  const query = useQuery({
    queryKey: QUERY_KEYS.deliveries,
    queryFn: () => deliveryService.list(),
  });

  const deliveries = query.data ?? [];
  const active = deliveries.filter((d) => ACTIVE_STATUSES.includes(d.status));
  const past = deliveries.filter((d) => !ACTIVE_STATUSES.includes(d.status));

  return {
    deliveries,
    active,
    past,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Progress (0-1) along the route, derived from status — feeds RouteRail. */
export function getDeliveryProgress(status: DeliveryStatus): number {
  const progressMap: Record<DeliveryStatus, number> = {
    draft: 0,
    pending_payment: 0,
    package_dropped: 0.15,
    in_transit: 0.55,
    arrived_at_node: 0.85,
    ready_for_collection: 1,
    completed: 1,
    cancelled: 0,
  };
  return progressMap[status];
}

export type { Delivery };
