"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import type { NodeOrderSummary } from "@/core/types";

/**
 * `GET /handoffs/my-node/orders` exactly as the server returns it: one row
 * per order with a single `myRole`. When the caller belongs to both ends of
 * an order that row can only describe one side, so screens must use
 * `useMyNodeOrders` (use-my-node-orders.ts), which expands those orders.
 * This split exists because `useMyNodes` needs the raw list to discover a
 * staff session's stations, and `useMyNodeOrders` needs `useMyNodes`.
 */
export function useRawMyNodeOrders() {
  const query = useQuery({
    queryKey: QUERY_KEYS.nodeMyOrders,
    queryFn: () => nodeService.getMyNodeOrders(),
  });

  const orders = useMemo(() => query.data ?? [], [query.data]);

  return {
    orders,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Which of the caller's Nodes the row's `myRole` points at. */
export function myNodeId(
  order: Pick<NodeOrderSummary, "myRole" | "originNodeId" | "destinationNodeId">
): string {
  return order.myRole === "origin" ? order.originNodeId : order.destinationNodeId;
}

/** Same, for the Node's display name. */
export function myNodeName(
  order: Pick<NodeOrderSummary, "myRole" | "originNodeName" | "destinationNodeName">
): string {
  return order.myRole === "origin" ? order.originNodeName : order.destinationNodeName;
}

/**
 * An order whose origin and destination are both Nodes the caller belongs
 * to comes back once, tagged with one role. Split it into one entry per
 * role so each station's screens see its own side.
 */
export function expandOrderRoles(
  orders: NodeOrderSummary[],
  myNodeIds: ReadonlySet<string>
): NodeOrderSummary[] {
  if (myNodeIds.size === 0) return orders;
  return orders.flatMap((order) =>
    myNodeIds.has(order.originNodeId) && myNodeIds.has(order.destinationNodeId)
      ? [
          { ...order, myRole: "origin" as const },
          { ...order, myRole: "destination" as const },
        ]
      : [order]
  );
}
