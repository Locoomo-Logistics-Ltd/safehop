"use client";

import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "@/core/api/services";
import type { DeliveryQuoteRequest } from "@/core/types";

/**
 * `POST /delivery-quotes` — the price preview shown at Checkout.
 * Reserves nothing (unlike `POST /payments/intents`, which holds a slot
 * at the origin Node for ~15 min), so it's safe to run on mount, retry
 * and refetch. The same inputs always price the same at payment.
 *
 * Re-quote after `validUntil`: `refetchInterval` is left off on purpose;
 * the screen calls `isExpired()` at the moment of paying instead of
 * burning the 30/min rate limit on a screen someone has walked away from.
 */
export function useDeliveryQuote(request: DeliveryQuoteRequest | null) {
  const query = useQuery({
    queryKey: ["delivery-quote", request],
    queryFn: () => deliveryService.quote(request!),
    enabled: !!request,
    staleTime: 60_000,
    // A 422 NO_DELIVERY_OPTION / 404 won't fix itself on retry.
    retry: false,
    refetchOnWindowFocus: false,
  });

  // A function, not a value: "now" must be read when the sender taps Pay,
  // not frozen at render time.
  const isExpired = () => (query.data ? Date.now() > new Date(query.data.validUntil).getTime() : false);

  return {
    quote: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isExpired,
    refetch: query.refetch,
  };
}
