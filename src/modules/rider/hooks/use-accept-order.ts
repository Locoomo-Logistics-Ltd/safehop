"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { riderService } from "@/core/api/services";
import { isApiError } from "@/core/api/errors";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useRiderJobsStore } from "@/store/rider-jobs.store";
import type { AvailableOrder } from "@/core/types";

/**
 * Claims an order off the board.
 *
 * Takes the whole `AvailableOrder` rather than just its id because the
 * accept response is a minimal receipt (id, trackingCode, status, two
 * node ids) — no node names, no addresses, no parcel description. Those
 * only ever exist in the board row we're holding right now, and there's
 * no rider-scoped endpoint to fetch them back later, so this is the one
 * moment they can be captured. See store/rider-jobs.store.ts for why
 * that matters and what it costs.
 */
export function useAcceptOrder() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addDelivery = useRiderJobsStore((state) => state.addDelivery);

  const mutation = useMutation({
    mutationFn: (order: AvailableOrder) => riderService.acceptAvailableOrder(order.id),

    onSuccess: (summary, order) => {
      addDelivery({
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
        acceptedAt: new Date().toISOString(),
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderAvailableOrdersRoot });
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
