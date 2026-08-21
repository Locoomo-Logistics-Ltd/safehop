"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { riderService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isApiError } from "@/core/api/errors";
import { HANDOFF_CODE_TTL_SECONDS } from "@/core/types";
import type { HandoffType } from "@/core/types";

/**
 * Requests and holds the 6-digit code the rider reads to the Node
 * operator.
 *
 * Deliberately **not** a query and deliberately not fired on mount. The
 * code lives 5 minutes; issuing one when the rider merely opens the
 * screen means it's usually dead by the time they reach the counter,
 * and each request supersedes the last, so an auto-refreshing query
 * would invalidate a code the rider might be mid-way through reading
 * aloud. It fires once, on an explicit "I'm at the counter" tap.
 *
 * The code is held in mutation state only — never written to the store,
 * localStorage, a URL, or a log. It isn't recoverable server-side
 * either; if it's lost, the rider asks for a new one.
 */
export function useHandoffCode(orderId: string, type: HandoffType) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => riderService.requestHandoffCode(orderId, type),

    onError: (error) => {
      // `404` here means the server doesn't consider this rider assigned
      // to this order — almost always a delivery that's since moved past
      // this leg. Refetch so the active list stops showing it.
      if (isApiError(error) && error.code === "NOT_FOUND") {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderMyOrders });
      }
    },
  });

  const expiresAt = mutation.data?.expiresAt;

  // The countdown is derived from a ticking clock rather than stored as
  // "seconds left", so the only state the interval touches is `now`.
  // Storing the remainder instead would mean re-seeding it from an
  // effect every time a new code arrives, which is both an extra render
  // and the cascading-setState pattern the lint rule rejects.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // Clamped to the documented TTL because `now` can be up to a tick
  // stale when a code first lands (the interval only starts after the
  // response) — without the clamp that shows as a brief, wrong
  // countdown longer than any code can possibly live.
  const secondsRemaining = expiresAt
    ? Math.min(
        HANDOFF_CODE_TTL_SECONDS,
        Math.max(0, Math.round((new Date(expiresAt).getTime() - now) / 1000))
      )
    : 0;

  // Wrapped rather than exposed raw so it can sit straight on an
  // onClick — `mutate` would otherwise receive the click event as its
  // `variables` argument.
  const { mutate } = mutation;
  const requestCode = useCallback(() => mutate(), [mutate]);

  const isExpired = !!mutation.data && secondsRemaining === 0;
  const isNoLongerAssigned = isApiError(mutation.error) && mutation.error.code === "NOT_FOUND";

  return {
    /** Null once expired — an expired code is worse than none, since the operator would just get INVALID_HANDOFF_CODE. */
    code: isExpired ? null : (mutation.data?.code ?? null),
    secondsRemaining,
    isExpired,
    /** True when the server says this order isn't this rider's — the delivery has already been pruned from the store. */
    isNoLongerAssigned,

    requestCode,
    isRequesting: mutation.isPending,
    /** Suppressed for the 404 case, which the screen explains in its own words rather than as a fetch failure. */
    requestError: isNoLongerAssigned ? null : mutation.error,
    hasRequested: mutation.isSuccess || mutation.isPending,
  };
}
