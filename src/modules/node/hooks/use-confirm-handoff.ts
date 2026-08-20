"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isApiError } from "@/core/api/errors";
import {
  isAwaitingArrival,
  isAwaitingPickup,
  useMyNodeOrders,
} from "@/modules/node/hooks/use-my-node-orders";
import type { HandoffType } from "@/core/types";

/**
 * Drives `POST /handoffs/orders/:id/confirm-handoff` — the operator
 * typing in the 6-digit code a rider states at the counter.
 *
 * Both directions post to the **same** endpoint and differ only in
 * `type` — `rider_pickup` when the rider is taking a parcel away from
 * this Node, `rider_arrival` when they're handing one over.
 *
 * ── The rider brings a code, and nothing else ──────────────────────
 *
 * Per docs/API.md the 6-digit code is the entire handoff protocol
 * between rider and operator: it isn't emailed, isn't logged, and
 * carries no reference to the order it belongs to. The endpoint,
 * however, is keyed on the order **uuid**. So the operator resolves the
 * parcel from `GET /handoffs/my-node/orders` (real, confirmed per
 * docs/API.md, added 2026-08-17) — every order that's ever touched this
 * Node, either side, with `myRole` telling which. Both directions are
 * now the same shape of pick-list: filter by `myRole` + the status that
 * direction expects, tap the row, type the digits.
 *
 * This supersedes the 2026-08-15 design that cached the origin side in
 * `store/node-outgoing.store.ts` and left the destination side blocked
 * outright (no destination-scoped lookup existed yet). Both stores are
 * deleted; see `use-my-node-orders.ts`.
 */

/** Per docs/API.md: 5 wrong guesses lock a code out permanently. */
const MAX_CODE_ATTEMPTS = 5;

export function useConfirmHandoff() {
  const queryClient = useQueryClient();
  const { orders, isLoading: isLoadingOrders } = useMyNodeOrders();

  const [handoffType, setHandoffType] = useState<HandoffType>("rider_pickup");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [failedCodeAttempts, setFailedCodeAttempts] = useState(0);
  /** Set when a confirm proved a listed order stale, so the screen can say why a row vanished. */
  const [prunedTrackingCode, setPrunedTrackingCode] = useState<string | null>(null);

  const isPickup = handoffType === "rider_pickup";
  const pickableOrders = useMemo(
    () => orders.filter(isPickup ? isAwaitingPickup : isAwaitingArrival),
    [orders, isPickup]
  );

  const confirmMutation = useMutation({
    mutationFn: ({ orderId, code }: { orderId: string; code: string }) =>
      nodeService.confirmRiderHandoff(orderId, { type: handoffType, code }),
    onSuccess: () => {
      setFailedCodeAttempts(0);
      setPrunedTrackingCode(null);
      // The order moved to its next status server-side — refetch so it
      // drops off this pick-list and (for an arrival) appears on the
      // awaiting-collection screen.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeMyOrders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeParcels });
    },
    onError: (error, variables) => {
      if (!isApiError(error)) return;

      // Counted purely to decide when to tell the operator "ask for a
      // fresh code" — the server owns the actual lockout, and this
      // counter never gates the request.
      if (error.code === "INVALID_HANDOFF_CODE") {
        setFailedCodeAttempts((n) => n + 1);
        return;
      }

      // A `409` means the order isn't at the step this direction
      // expects and a `404` means it's the wrong side of this Node for
      // this `type` — either way the selected row is stale. Refetch so
      // the list drops it, and say why rather than letting it vanish
      // mid-tap with no explanation.
      const isStale = error.code === "ILLEGAL_ORDER_TRANSITION" || error.code === "NOT_FOUND";
      if (isStale) {
        const stale = pickableOrders.find((o) => o.id === variables.orderId);
        if (stale) setPrunedTrackingCode(stale.trackingCode);
        setSelectedOrderId(null);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeMyOrders });
      }
    },
  });

  const selectHandoffType = useCallback((type: HandoffType) => {
    setHandoffType(type);
    setSelectedOrderId(null);
    setFailedCodeAttempts(0);
    setPrunedTrackingCode(null);
    confirmMutation.reset();
    // `reset` is stable on a TanStack mutation result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectOrder = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setPrunedTrackingCode(null);
    confirmMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    setSelectedOrderId(null);
    setFailedCodeAttempts(0);
    setPrunedTrackingCode(null);
    confirmMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { mutate: confirmMutate } = confirmMutation;
  const confirmHandoff = useCallback(
    (code: string) => {
      if (!selectedOrderId) return;
      confirmMutate({ orderId: selectedOrderId, code });
    },
    [confirmMutate, selectedOrderId]
  );

  return {
    handoffType,
    selectHandoffType,

    /** Orders this direction can legally confirm — pickup: this Node's origin side, awaiting a rider; arrival: this Node's destination side, rider en route. */
    pickableOrders,
    isLoadingOrders,

    selectedOrderId,
    selectedOrder: pickableOrders.find((o) => o.id === selectedOrderId) ?? null,
    selectOrder,

    /** Takes only the code — the order and type are whatever's selected. */
    confirmHandoff,
    isConfirming: confirmMutation.isPending,
    confirmError: confirmMutation.error,
    confirmedOrder: confirmMutation.data,
    isConfirmed: confirmMutation.isSuccess,

    /** Set when a confirm proved a listed order stale and it dropped off the pick-list. */
    prunedTrackingCode,

    failedCodeAttempts,
    /**
     * Advisory only. The server may have locked the code out earlier
     * (attempts from another device count too), so this is a floor on
     * "you should probably ask for a new code," never a ceiling on
     * what's permitted.
     */
    shouldRequestFreshCode: failedCodeAttempts >= MAX_CODE_ATTEMPTS,

    reset,
  };
}
