"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { myNodeId } from "./use-raw-node-orders";
import type { NodeQueue } from "@/core/types";

const PAGE_SIZE = 20;

/**
 * One server-side work queue from `GET /handoffs/my-node/orders?queue=…`
 * (docs/LOGISTICS_API.md §5.2). The server returns the queue across every
 * Node the caller belongs to; `nodeId` narrows it to the station the
 * operator is standing at, as the dashboard always has.
 *
 * Replaces the client-side tabs that were derived from one capped list
 * of 100 orders (a busy station's older parcels silently dropped out).
 * Polls every 30 s while the tab is visible — TanStack pauses interval
 * refetches in a hidden tab.
 */
export function useNodeQueue(queue: NodeQueue, nodeId: string | undefined) {
  const query = useInfiniteQuery({
    queryKey: [...QUERY_KEYS.nodeQueue(queue)],
    queryFn: ({ pageParam }) => nodeService.getNodeQueue({ queue, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    refetchInterval: 30_000,
  });

  const orders = useMemo(() => {
    const all = query.data?.pages.flatMap((p) => p.items) ?? [];
    return nodeId ? all.filter((o) => myNodeId(o) === nodeId) : all;
  }, [query.data, nodeId]);

  return {
    orders,
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasMore: !!query.hasNextPage,
    loadMore: () => query.fetchNextPage(),
    isLoadingMore: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
