"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isApiError } from "@/core/api/errors";
import { HANDOFF_STATUS } from "@/core/types";

/**
 * Drives the consumer drop-off counter flow:
 * `GET /handoffs/orders/by-tracking-code/:code` to preview the parcel,
 * then `POST /handoffs/orders/:id/drop-off` to confirm receipt.
 *
 * These are two calls, not one, on purpose — the lookup is a pure read,
 * which is what gives the operator a chance to compare the physical
 * parcel against `parcelDescription` before taking custody of it. (The
 * superseded `vendorService.checkIn()` did lookup+mutate atomically and
 * offered no such moment.)
 *
 * A `404` here is an answer, not a failure: the lookup is scoped to
 * orders whose `originNodeId` is this operator's own Node, so "no such
 * code" and "that parcel belongs to a different Node" are deliberately
 * indistinguishable. It's surfaced as `notFound` rather than folded
 * into `lookupError` — same pattern as `useRiderVerification`'s
 * `notStarted` — and `retry: false` because retrying a definitive
 * answer just delays it.
 */
export function useHandoffLookup(trackingCode: string) {
  const queryClient = useQueryClient();

  const lookupQuery = useQuery({
    queryKey: QUERY_KEYS.vendorHandoffOrder(trackingCode),
    queryFn: () => vendorService.lookupOrderByTrackingCode(trackingCode),
    enabled: !!trackingCode,
    retry: false,
  });

  const notFound = isApiError(lookupQuery.error) && lookupQuery.error.code === "NOT_FOUND";

  const dropOffMutation = useMutation({
    mutationFn: (orderId: string) => vendorService.confirmDropOff(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorParcels });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.vendorHandoffOrder(trackingCode),
      });
    },
  });

  const order = lookupQuery.data;

  return {
    order,
    isLoading: lookupQuery.isLoading,
    notFound,
    lookupError: notFound ? null : lookupQuery.error,

    /**
     * Whether this order is actually sitting at the step drop-off
     * expects. The endpoint is idempotent for a repeated confirm, but
     * an order that's already moved past origin (a rider has it) is a
     * `409` — worth telling the operator before they tap, since the
     * parcel in their hand probably isn't the one they think it is.
     */
    isAwaitingDropOff: order?.status === HANDOFF_STATUS.awaitingDropOff,
    isAlreadyReceived: order?.status === HANDOFF_STATUS.parcelReceivedAtOrigin,

    confirmDropOff: dropOffMutation.mutate,
    isConfirming: dropOffMutation.isPending,
    dropOffError: dropOffMutation.error,
    isConfirmed: dropOffMutation.isSuccess,
  };
}
