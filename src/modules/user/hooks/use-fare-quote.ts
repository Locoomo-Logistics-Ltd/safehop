"use client";

import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "@/core/api/services";
import type { DeliveryMethod, ParcelDetails } from "@/core/types";

/**
 * Fetches a real, server-calculated fare quote whenever the relevant
 * draft fields are complete. Replaces the old synchronous
 * `calculateQuote()` client-side math — the real API's
 * orders/calculate-fare is the source of truth for pricing.
 */
export function useFareQuote(params: {
  originNodeId: string | null;
  destinationAddress: string | null;
  parcel: ParcelDetails | null;
  method: DeliveryMethod | null;
}) {
  const { originNodeId, destinationAddress, parcel, method } = params;
  const isReady = !!originNodeId && !!destinationAddress && !!parcel && !!method;

  const query = useQuery({
    queryKey: ["fare-quote", originNodeId, destinationAddress, parcel?.size, method],
    queryFn: () =>
      deliveryService.calculateFare({
        originNodeId: originNodeId!,
        destinationAddress: destinationAddress!,
        parcel: parcel!,
        method: method!,
      }),
    enabled: isReady,
  });

  return {
    quote: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
