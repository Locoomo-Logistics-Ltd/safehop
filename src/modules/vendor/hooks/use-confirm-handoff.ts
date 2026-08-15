"use client";

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isApiError } from "@/core/api/errors";
import { useNodeParcelsStore } from "@/store/node-parcels.store";
import type { HandoffType } from "@/core/types";

/**
 * Drives `POST /handoffs/orders/:id/confirm-handoff` — the operator
 * typing in the 6-digit code a rider states at the counter.
 *
 * Both directions post to the **same** endpoint and differ only in
 * `type` — `rider_pickup` when the rider is taking a parcel away from
 * this Node, `rider_arrival` when they're handing one over. The
 * operator therefore gets one flow either way: find the parcel by
 * tracking code, type the rider's code, confirm.
 *
 * ── The origin/destination asymmetry (a real API gap) ──────────────
 *
 * The confirm endpoint is keyed on the order's **uuid**, and the only
 * documented way to turn something a human can read into that uuid is
 * `GET /handoffs/orders/by-tracking-code/:code` — which docs/API.md
 * scopes to orders whose `originNodeId` is *your* Node. Read strictly,
 * a destination operator's lookup always `404`s, leaving them no way to
 * obtain the uuid they're required to POST to.
 *
 * This hook attempts the lookup for **both** types regardless. It's the
 * documented call in either direction, it costs one request, and the
 * alternative — asking the operator to type a uuid — was rejected:
 * nobody can read a uuid off a parcel, and a counter is the wrong place
 * to be transcribing 36 characters from someone else's phone.
 *
 * So a destination-side `404` is a dead end by design. The screen says
 * so plainly rather than offering an escape hatch that would be worse
 * than the problem.
 *
 * **Flag to the backend team:** either widen the by-tracking-code
 * lookup to also match the destination Node (the response carries no
 * receiver PII, so the privacy rationale for the current scoping looks
 * satisfied either way), or accept a tracking code as the
 * `confirm-handoff` path param. Until one of those lands, arrival
 * confirmation depends entirely on whether the deployed backend is
 * stricter than its docs.
 */

/** Per docs/API.md: 5 wrong guesses lock a code out permanently. */
const MAX_CODE_ATTEMPTS = 5;

export function useConfirmHandoff() {
  const queryClient = useQueryClient();
  const addParcel = useNodeParcelsStore((s) => s.addParcel);

  const [handoffType, setHandoffType] = useState<HandoffType>("rider_pickup");
  const [failedCodeAttempts, setFailedCodeAttempts] = useState(0);

  /**
   * A mutation rather than a query because the operator triggers it
   * explicitly ("find this parcel"), and re-typing the same tracking
   * code after a miss should genuinely re-ask the server rather than
   * replay a cached `404`.
   */
  const lookupMutation = useMutation({
    mutationFn: (trackingCode: string) =>
      vendorService.lookupOrderByTrackingCode(trackingCode.trim()),
  });

  const confirmMutation = useMutation({
    mutationFn: ({ orderId, code }: { orderId: string; code: string }) =>
      vendorService.confirmRiderHandoff(orderId.trim(), { type: handoffType, code }),
    onSuccess: (summary) => {
      setFailedCodeAttempts(0);

      // **The one moment the uuid is in this operator's hands.**
      // Everything still owed on this parcel — intake, resend, collect —
      // is keyed on it, and the only documented lookup is scoped to the
      // origin Node, so it can never be recovered later. Capture it now
      // or lose the parcel. See store/node-parcels.store.ts.
      if (handoffType === "rider_arrival") {
        addParcel({
          id: summary.id,
          trackingCode: summary.trackingCode,
          status: summary.status,
          destinationNodeId: summary.destinationNodeId,
          arrivedAt: new Date().toISOString(),
        });
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorParcels });
    },
    onError: (error) => {
      // Counted purely to decide when to tell the operator "ask for a
      // fresh code" — the server owns the actual lockout, and this
      // counter never gates the request.
      if (isApiError(error) && error.code === "INVALID_HANDOFF_CODE") {
        setFailedCodeAttempts((n) => n + 1);
      }
    },
  });

  const selectHandoffType = useCallback((type: HandoffType) => {
    setHandoffType(type);
    setFailedCodeAttempts(0);
    lookupMutation.reset();
    confirmMutation.reset();
    // `reset` is stable on a TanStack mutation result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    setFailedCodeAttempts(0);
    lookupMutation.reset();
    confirmMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookupNotFound =
    isApiError(lookupMutation.error) && lookupMutation.error.code === "NOT_FOUND";

  return {
    handoffType,
    selectHandoffType,

    /** The only way to an order id, in both directions — see this file's header. */
    resolveByTrackingCode: lookupMutation.mutate,
    resolvedOrder: lookupMutation.data,
    isResolving: lookupMutation.isPending,
    lookupNotFound,
    lookupError: lookupNotFound ? null : lookupMutation.error,

    confirmHandoff: confirmMutation.mutate,
    isConfirming: confirmMutation.isPending,
    confirmError: confirmMutation.error,
    confirmedOrder: confirmMutation.data,
    isConfirmed: confirmMutation.isSuccess,

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
