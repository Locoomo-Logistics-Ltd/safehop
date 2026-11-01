"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { deliveryService, ORDER_TAB_STATUSES, type OrderTab } from "@/core/api/services/delivery.service";
import { QUERY_KEYS } from "@/core/config/constants";

const PAGE_SIZE = 20;

/**
 * Dashboard feed: what's still moving (including a return the sender
 * must collect) and the most recent finished orders — two server-side
 * `status` filters instead of one capped list split on the client.
 */
export function useDeliveries() {
  const active = useQuery({
    queryKey: [...QUERY_KEYS.deliveries, "dashboard-active"],
    queryFn: () =>
      deliveryService.listPage({
        statuses: [...ORDER_TAB_STATUSES.active, "return_initiated", "return_in_transit", "returned_to_origin", "ready_for_sender_collection"],
        limit: 50,
      }),
    refetchInterval: 30_000,
  });
  const past = useQuery({
    queryKey: [...QUERY_KEYS.deliveries, "dashboard-past"],
    queryFn: () =>
      deliveryService.listPage({ statuses: ["completed", "return_completed"], limit: 10 }),
  });

  return {
    active: active.data?.items ?? [],
    past: past.data?.items ?? [],
    isLoading: active.isLoading || past.isLoading,
    isError: active.isError || past.isError,
    refetch: () => Promise.all([active.refetch(), past.refetch()]),
  };
}

/** One "Track" tab (Active / Delivered / Returns), paged with a Load more button. Polls the loaded pages every 30 s while visible. */
export function useOrdersTab(tab: OrderTab) {
  const query = useInfiniteQuery({
    queryKey: [...QUERY_KEYS.deliveries, "tab", tab],
    queryFn: ({ pageParam }) =>
      deliveryService.listPage({ statuses: ORDER_TAB_STATUSES[tab], page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    refetchInterval: tab === "delivered" ? false : 30_000,
  });

  const orders = query.data?.pages.flatMap((p) => p.items) ?? [];

  return {
    orders,
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    hasMore: !!query.hasNextPage,
    loadMore: () => query.fetchNextPage(),
    isLoadingMore: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
