"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { riderService } from "@/core/api/services";
import { isApiError } from "@/core/api/errors";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import type { AvailableOrder, MyOrderSummary } from "@/core/types";

/**
 * Claims an order off the board.
 *
 * Still takes the whole `AvailableOrder`, not just its id: the accept
 * response is a minimal receipt (id, trackingCode, status, two node
 * ids) with no node names/addresses/parcel description, and the
 * handoff screen this navigates to needs those immediately — a
 * background refetch of `GET /handoffs/my-orders` (real, confirmed per
 * docs/API.md, 2026-08-17) would land a beat too late and flash an
 * empty state. So the accepted board row is seeded straight into that
 * query's cache, then the query is invalidated anyway so the next
 * natural refetch reconciles with the server's own copy.
 */
export function useAcceptOrder() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (order: AvailableOrder) => riderService.acceptAvailableOrder(order.id),

    onSuccess: (summary, order) => {
      const accepted: MyOrderSummary = {
        id: summary.id,
        trackingCode: summary.trackingCode,
        status: summary.status,
        originNodeId: order.originNodeId,
        originNodeName: order.originNodeName,
        originNodeAddress: order.originNodeAddress,
        destinationNodeId: order.destinationNodeId,
        destinationNodeName: order.destinationNodeName,
        destinationNodeAddress: order.destinationNodeAddress,
        parcelDescription: order.parcelDescription,
        parcelSize: order.parcelSize,
        createdAt: order.createdAt,
      };
      queryClient.setQueryData<MyOrderSummary[]>(QUERY_KEYS.riderMyOrders, (existing) => [
        accepted,
        ...(existing ?? []).filter((o) => o.id !== accepted.id),
      ]);

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderAvailableOrdersRoot });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderMyOrders });
      router.push(ROUTES.riderHandoff(summary.id));
    },

    onError: (error) => {
      // A lost accept race (`409 ILLEGAL_ORDER_TRANSITION`) means our
      // copy of the board is describing an order that's already gone.
      // Refetching is the fix docs/API.md prescribes; retrying the
      // accept would fail identically. The message the rider sees comes
      // from getFriendlyError(), not from here.
      if (isApiError(error) && error.code === "ILLEGAL_ORDER_TRANSITION") {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderAvailableOrdersRoot });
      }
    },
  });

  return {
    acceptOrder: mutation.mutate,
    isAccepting: mutation.isPending,
    /** The order currently being claimed, so a list can spin only the row that was tapped. */
    acceptingOrderId: mutation.isPending ? mutation.variables?.id : undefined,
    acceptError: mutation.error,
    resetAcceptError: mutation.reset,
  };
}
